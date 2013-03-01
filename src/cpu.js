(function (define) {
    define(function () {

        'use strict';

        var nuArray = require('./array'),
            nuDict = require('./dict'),
            nuStack = require('./stack'),
            nuSegment = require('./segment'),
            nuError = require('./errors'),
            adornOps = require('./adornOps'),
            loadPrelude = require('./prelude'),
            undef,
            adornRegistersAndHelpers = function (ops) {
                return Object.defineProperties(
                    {},
                    {
                        run: {value: function () {
                            delete this.result;
                            this.running = true;
                            while (this.running) {
                                this.dispatch(this.cs.ip.fetchAndInc());
                            }
                            delete this.op;
                            return this.result;
                        }},
                        dispatch: {value: function (op) {
                            if (op === nuSegment.segmentExhausted) {
                                delete this.op;
                                if (this.cs.dps) {
                                    this.enterStack(this.cs.dps); // implicit return with 0 results
                                } else {
                                    this.result = this.cs;
                                    this.running = false;
                                }
                            } else {
                                if (nuArray.isArray(op) && op.allChars) {
                                    op = op.toRawString();
                                }
                                this.op = op;
                                if ((op === 'SEG_END' || op === ops['SEG_END']) && ! this.pushed) {
                                    this.deferred -= 1;
                                    if (this.deferred < 0) {
                                        nuError('TOO MANY SEG_ENDS');
                                    }
                                }
                                if (this.deferred > 0) {
                                    this.cs.push(op);
                                    if ((op === 'PUSH' || op === ops['PUSH']) && ! this.pushed) {
                                        this.pushed = true;
                                    } else if (this.pushed) {
                                        delete this.pushed;
                                    }
                                } else {
                                    if (typeof op === 'function') {
                                        op();
                                    } else if (op in ops) {
                                        op = ops[op];
                                        this.cs.ip.replaceMostRecent(op);
                                        op();
                                    } else {
                                        this.defaultOp(op);
                                    }
                                }
                                if (op === 'SEG_START' || op === ops['SEG_START']) {
                                    this.deferred += 1;
                                    delete this.pushed;
                                }
                            }
                        }},
                        setDefaultOp: {value: function (fun) {
                            if (typeof fun === 'function') {
                                Object.defineProperty(this, 'defaultOp', {value: fun.bind(ops)});
                            }
                        }},
                        deferred: {value: 0, writable: true},
                        lsps: {value: []},
                        ds: {value: nuArray([nuDict()]), writable: true},
                        cs: {value: undef, writable: true},
                        dereferenceScope: {value: function (lsl) {
                            if (0 <= lsl && lsl < this.lsps.length) {
                                return this.lsps[lsl];
                            } else {
                                nuError.invalidOperand(lsl);
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
                            return;
                        }},
                        enterSegment: {value: function (segment, takeStack, parentStack) {
                            this.setStackAndLSPs(nuStack(undef, takeStack, parentStack, segment, 0));
                            return;
                        }},
                        enterStack: {value: function (stack, resultsAry) {
                            if (nuStack.isStack(stack)) {
                                this.setStackAndLSPs(stack);
                                if (resultsAry) {
                                    stack.appendArray(resultsAry);
                                }
                            } else if (stack === undef) {
                                this.running = false;
                                this.result = resultsAry;
                            } else {
                                nuError.invalidOperand(stack);
                            }
                            return;
                        }},
                        log: {value: console.log.bind(console), writable: true}
                    });
            };

        return function nuVCPU (segment) {
            var ops = {}, vcpu = adornRegistersAndHelpers(ops);
            adornOps(vcpu, ops);
            nuError.vcpu = vcpu;
            return Object.defineProperties(
                {},
                {
                    boot: {value: function () {
                        loadPrelude(vcpu);
                        // We blow away anything left on the stack
                        // here and have no take stack for the new
                        // segment either. Thus all prelude can do is
                        // populate dict stack.
                        vcpu.enterSegment(segment);
                        return vcpu.run();
                    }},

                    resume: {value: function (seg) {
                        var oldCS;
                        if (vcpu.cs !== undef) {
                            if (seg) {
                                oldCS = vcpu.cs.array;
                                vcpu.enterSegment(seg);
                                vcpu.cs.appendArray(oldCS);
                            }
                            return vcpu.run();
                        }
                    }},

                    // means to install hooks for use by testing.
                    installOp: {value: function (name, fun) {
                        ops[name] = function () {
                            fun(vcpu, ops);
                        };
                        ops[name].opCodeName = name;
                    }},

                    log: {get: function () { return vcpu.log; },
                          set: function (val) {
                              if (typeof val === 'function') {
                                  vcpu.log = val;
                              }
                          }},

                    ops: {value: Object.keys(ops) }
                });
        };

    });
}(typeof define === 'function' ? define : function (factory) { module.exports = factory(); }));
