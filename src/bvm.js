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
            var vcpu = adornRegistersAndHelpers(),
                ops = adornOps(vcpu);
            return Object.create(
                {},
                {
                    boot: {value: function () {
                        var op;
                        vcpu.cs = nuStack(undefined, undefined, segment, 0);
                        vcpu.lsps[0] = vcpu.cs;
                        vcpu.lsps.length = 1;
                        vcpu.running = true;
                        while (vcpu.running) {
                            op = vcpu.cs.ip.fetch();
                            if (op === segmentTypes.segmentExhausted) {
                                if (vcpu.cs.dps) {
                                    vcpu.enterStack(vcpu.cs.dps); // implicit return with 0 results
                                } else {
                                    vcpu.running = false;
                                }
                            } else {
                                if (op === 'SEG_END') {
                                    vcpu.deferred -= 1;
                                }
                                if (vcpu.deferred > 0) {
                                    vcpu.cs.push(op);
                                } else {
                                    if (op in ops) {
                                        ops[op]();
                                    } else {
                                        ops['UNKNOWN'](op);
                                    }
                                }
                                if (op === 'SEG_START') {
                                    vcpu.deferred += 1;
                                }
                            }
                        }
                        return vcpu.result;
                    }},

                    // means to install hooks for use by testing.
                    installOp: {value: function (name, fun) {
                        ops[name] = function () {
                            fun(vcpu, ops);
                        };
                    }}
            });
        };

        function adornRegistersAndHelpers () {
            return Object.create(
                {},
                {
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
                                resultsAry.forEach(function (elem) {
                                    stack.push(elem);
                                });
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

        function adornOps (vcpu) {
            var opsDir = path.join(__dirname, 'ops'),
                ops = {};
            fs.readdirSync(opsDir).forEach(function (opFile) {
                if (path.extname(opFile) in require.extensions) {
                    require(path.join(opsDir, opFile))(vcpu, ops);
                }
            });
            return ops;
        }

    });
}(typeof define === 'function' ? define : function (factory) { module.exports = factory(); }));
