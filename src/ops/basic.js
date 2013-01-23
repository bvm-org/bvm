(function (define) {
    define(function () {

        'use strict';

        var types = require('../types'),
            nuSegment = require('../segment'),
            nuError = require('../errors'),
            nuArray = require('../array'),
            nuOpcode = require('../opcode');

        return function (vcpu) {
            return {
                PUSH: function () {
                    var op = vcpu.cs.ip.fetchAndInc();
                    if (op === nuSegment.segmentExhausted) {
                        nuError.notEnoughOperands();
                    } else {
                        if (types.isLexicalAddress(op)) {
                            op = op.fix(vcpu); // fix it / make it portable. Does not alter segment
                        } else if (types.isRawString(op)) {
                            op = nuArray(op); // wrap strings as soon as they enter the stack
                        }
                        vcpu.cs.push(op);
                        return;
                    }
                },
                POP: nuOpcode(vcpu, 1, function () {
                }),
                DUPLICATE: nuOpcode(vcpu, 1, function (e) {
                    vcpu.cs.push(e);
                    vcpu.cs.push(e);
                    return;
                }),
                EXCHANGE: nuOpcode(vcpu, 2, function (a, b) {
                    vcpu.cs.push(b);
                    vcpu.cs.push(a);
                    return;
                }),
                COUNT: function () {
                    vcpu.cs.push(vcpu.cs.length());
                    return;
                },
                COPY: nuOpcode(
                    vcpu, [nuOpcode.tests.isNonNegativeInteger],
                    function (count, len) {
                        var idx;
                        if (len >= count) {
                            for (idx = len - count; idx < len; idx += 1) {
                                vcpu.cs.push(vcpu.cs.index(idx));
                            }
                            return;
                        } else {
                            nuError.notEnoughOperands();
                        }
                    }),
                INDEX: nuOpcode(vcpu, [nuOpcode.tests.isNonNegativeInteger], function (idx, len) {
                    if (len > idx) {
                        vcpu.cs.push(vcpu.cs.index(len - idx - 1));
                        return;
                    } else {
                        nuError.notEnoughOperands();
                    }
                }),
                ROLL: nuOpcode(
                    vcpu,
                    [nuOpcode.tests.isNonNegativeInteger, nuOpcode.tests.isInteger],
                    function (count, shift, len) {
                        var removed, split;
                        if (len >= count) {
                            removed = vcpu.cs.clear(len - count);
                            if (shift > 0) {
                                shift = - (shift % count);
                            } else if (shift < 0) {
                                shift = Math.abs(shift) % count;
                            }
                            vcpu.cs.appendArray(removed.splice(shift).concat(removed));
                            return;
                        } else {
                            nuError.notEnoughOperands();
                        }
                    }),
                CLONE: nuOpcode(vcpu, 1, function (e) {
                    var eT = typeof e;
                    vcpu.cs.push(e);
                    if (eT === 'number' ||
                        eT === 'boolean' ||
                        e === types.isLexicalAddress(e) ||
                        e === types.undef ||
                        e === types.mark) {
                        vcpu.cs.push(e);
                        return;
                    } else if (eT === 'object' && typeof e.clone === 'function') {
                        vcpu.cs.push(e.clone());
                        return;
                    } else {
                        nuError.internalError();
                    }
                }),
                CLEAR: function () {
                    vcpu.cs.clear();
                    return;
                },
                TRUE: function () {
                    vcpu.cs.push(true);
                    return;
                },
                FALSE: function () {
                    vcpu.cs.push(false);
                    return;
                },
                UNDEF: function () {
                    vcpu.cs.push(types.undef);
                    return;
                },
                HALT: function () {
                    vcpu.running = false;
                    return;
                }
            };
        };

    });
}(typeof define === 'function' ? define : function (factory) { module.exports = factory(); }));
