(function (define) {
    define(function () {

        'use strict';

        var types = require('./types');
        var nuArray = require('./array');
        var nuDict = require('./dict');
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
                        while (true) { // TODO: we currently just crash when we run out of ops!
                            op = vcpu.cs.ip.fetch();
                            if (op === 'SEG_END') {
                                vcpu.deferred -= 1;
                            }
                            if (vcpu.deferred > 0) {
                                vcpu.cs.push(op);
                            } else {
                                if (ops[op]) {
                                    ops[op]();
                                    if (op === 'SEG_START') {
                                        vcpu.deferred += 1;
                                    }
                                } else {
                                    ops['UNKNOWN'](op);
                                }
                            }
                        }
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
                        return this.lsps[lsl];
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
                    enter: {value: function (segment, argsAry) {
                        if (! argsAry) {
                            argsAry = [];
                        }
                        this.setStackAndLSPs(nuStack(argsAry, this.cs, segment, 0));
                        return undefined;
                    }},
                    exit: {value: function (resultsAry) {
                        this.setStackAndLSPs(this.cs.dps);
                        if (resultsAry) {
                            resultsAry.forEach(function (result) {
                                this.cs.push(result);
                            }.bind(this));
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

        // segment here is the new segment being entered.
        function nuStack (stackBase, oldStack, segment, index) {
            var stack = adornStackHeader(nuArray(stackBase), segment);
            if (oldStack) {
                stack.dps = oldStack;
            }
            stack.lps = segment.ls;
            if (stack.lps) {
                stack.lsl = segment.ls.lsl + 1;
            }
            stack.ip = segment.nuIP(index);
            stack.nuSegment = segment.nuSegment;
            return stack;
        }

        function adornStackHeader (stack, segment) {
            return Object.create(
                stack,
                {
                    dps: {value: undefined,
                          writable: true},
                    lps: {value: undefined,
                          writable: true},
                    lsl: {value: 0,
                          writable: true},
                    ip: {value: undefined,
                         writable: true},
                    nuSegment: {value: undefined,
                                writable: true},
                    clone: {value: function () {
                        return nuStack(stack.clone(), this.dps, segment, this.ip.index);
                    }}
                });
        }

    });
}(typeof define === 'function' ? define : function (factory) { module.exports = factory(); }));
