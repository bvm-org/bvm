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
                        while (true) { // TODO: we currently just crash when we run out of ops!
                            op = vcpu.cs.ip.fetch();
                            if (op === segmentTypes.segmentExhausted) {
                                if (vcpu.cs.dps) {
                                    vcpu.exit(); // implicit return with 0 results
                                } else {
                                    if (vcpu.cs.lsl !== 0) {
                                        // valid warning iff we don't have a HALT opcode
                                        console.warn('WARNING: halted in LSL', vcpu.cs.lsl);
                                    }
                                    return; // HALTED
                                }
                            } else {
                                if (op === 'SEG_END') {
                                    vcpu.deferred -= 1;
                                }
                                if (vcpu.deferred > 0) {
                                    vcpu.cs.push(op);
                                } else {
                                    if (ops[op]) {
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

    });
}(typeof define === 'function' ? define : function (factory) { module.exports = factory(); }));
