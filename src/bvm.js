(function (define) {
    define(function () {

        'use strict';

        var types = require('./types');
        var nuArray = require('./array');
        var nuDict = require('./dict');
        var nuStack = require('./stack');
        var segmentTypes = require('./segment');
        var fs = require('fs');
        var path = require('path');

        return function nuVCPU (segment) {
            var ops = {}, vcpu = adornRegistersAndHelpers(ops);
            adornOps(vcpu, ops);
            return Object.defineProperties(
                {},
                {
                    boot: {value: function () {
                        vcpu.enterSegment(segment, undefined, undefined);
                        return vcpu.run();
                    }},

                    // means to install hooks for use by testing.
                    installOp: {value: function (name, fun) {
                        ops[name] = function () {
                            fun(vcpu, ops);
                        };
                    }}
            });
        };

        function adornRegistersAndHelpers (ops) {
            return Object.defineProperties(
                {},
                {
                    run: {value: function () {
                        delete this.result;
                        this.running = true;
                        while (this.running) {
                            this.dispatch(this.cs.ip.fetchAndInc());
                        }
                        return this.result;
                    }},
                    dispatch: {value: function (op) {
                        if (op === segmentTypes.segmentExhausted) {
                            if (this.cs.dps) {
                                this.enterStack(this.cs.dps); // implicit return with 0 results
                            } else {
                                this.result = this.cs;
                                this.running = false;
                            }
                        } else {
                            if (op === 'SEG_END' || op === ops['SEG_END']) {
                                this.deferred -= 1;
                                if (this.deferred < 0) {
                                    throw "TOO MANY SEG_ENDS"; // TODO interrupt handler
                                }
                            }
                            if (this.deferred > 0) {
                                this.cs.push(op);
                            } else {
                                if (typeof op === 'function') {
                                    op();
                                } else if (op in ops) {
                                    op = ops[op];
                                    this.cs.ip.replaceMostRecent(op);
                                    op();
                                } else {
                                    ops['UNKNOWN'](op);
                                }
                            }
                            if (op === 'SEG_START' || op === ops['SEG_START']) {
                                this.deferred += 1;
                            }
                        }
                    }},
                    deferred: {value: 0, writable: true},
                    lsps: {value: []},
                    cd: {value: nuDict(), writable: true},
                    cs: {value: undefined, writable: true},
                    dereferenceScope: {value: function (lsl) {
                        if (0 <= lsl && lsl < this.lsps.length) {
                            return this.lsps[lsl];
                        } else {
                            throw "ILLEGAL LEXICAL STACK LEVEL";
                        }
                    }},
                    setStackAndLSPs: {value: function (stack) {
                        var maxidx = stack.lsl, idx, lps;
                        this.lsps.length = 1 + maxidx;
                        this.lsps[maxidx] = stack;
                        lps = stack.lps;
                        for (idx = maxidx - 1; idx >= 0 && this.lsps[idx] !== lps; idx -= 1) {
                            this.lsps[idx] = lps;
                            lps = lps.lps;
                        }
                        this.cs = stack;
                        return undefined;
                    }},
                    enterSegment: {value: function (segment, argsAry, parentStack) {
                        this.setStackAndLSPs(nuStack(argsAry, parentStack, segment, 0));
                        return undefined;
                    }},
                    enterStack: {value: function (stack, resultsAry) {
                        if (nuStack.isStack(stack)) {
                            this.setStackAndLSPs(stack);
                            if (resultsAry) {
                                stack.appendArray(resultsAry);
                            }
                        } else if (stack === undefined) {
                            this.running = false;
                            this.result = resultsAry;
                        } else {
                            throw 'ILLEGAL MANOEUVRE'; // TODO interrupt handler
                        }
                        return undefined;
                    }}
                });
        }

        function adornOps (vcpu, ops) {
            var opsDir = path.join(__dirname, 'ops'), opsObj, fun;
            fs.readdirSync(opsDir).forEach(function (opFile) {
                if (path.extname(opFile) in require.extensions) {
                    opsObj = require(path.join(opsDir, opFile))(vcpu);
                    Object.keys(opsObj).forEach(function (key) {
                        fun = opsObj[key].bind(ops);
                        fun.toJSON = function () { return key + '!'; };
                        opsObj[key] = { configurable: false,
                                        writable: false,
                                        enumerable: false,
                                        value: fun
                                      };
                    });
                    Object.defineProperties(ops, opsObj);
                }
            });
        }

    });
}(typeof define === 'function' ? define : function (factory) { module.exports = factory(); }));
