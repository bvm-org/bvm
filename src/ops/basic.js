(function (define) {
    define(function () {

        'use strict';

        var types = require('../types'),
            nuSegment = require('../segment'),
            nuError = require('../errors'),
            nuArray = require('../array');

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
                POP: function () {
                    if (vcpu.cs.length() > 0) {
                        return vcpu.cs.pop();
                    } else {
                        nuError.notEnoughOperands();
                    }
                },
                DUPLICATE: function () {
                    var len = vcpu.cs.length();
                    if (len > 0) {
                        vcpu.cs.push(vcpu.cs.index(len - 1));
                        return;
                    } else {
                        nuError.notEnoughOperands();
                    }
                },
                EXCHANGE: function () {
                    var len = vcpu.cs.length(), tmp;
                    if (len > 1) {
                        len -= 1;
                        tmp = vcpu.cs.index(len);
                        vcpu.cs.store(len, vcpu.cs.index(len - 1));
                        vcpu.cs.store(len - 1, tmp);
                        return;
                    } else {
                        nuError.notEnoughOperands();
                    }
                },
                COUNT: function () {
                    vcpu.cs.push(vcpu.cs.length());
                    return;
                },
                COPY: function () {
                    var len = vcpu.cs.length(), count, idx;
                    if (len > 0) {
                        count = vcpu.cs.pop();
                        if (typeof count === 'number' &&
                            count >= 0 && count === Math.round(count)) {
                            len -= 1;
                            if (len >= count) {
                                for (idx = len - count; idx < len; idx += 1) {
                                    vcpu.cs.push(vcpu.cs.index(idx));
                                }
                                return;
                            } else {
                                nuError.notEnoughOperands();
                            }
                        } else {
                            nuError.invalidOperand(count);
                        }
                    } else {
                        nuError.notEnoughOperands();
                    }
                },
                INDEX: function () {
                    var len = vcpu.cs.length(), idx;
                    if (len > 0) {
                        idx = vcpu.cs.pop();
                        len -= 1;
                        if (typeof idx === 'number' &&
                            idx >= 0 && idx === Math.round(idx)) {
                            if (len > idx) {
                                vcpu.cs.push(vcpu.cs.index(len - idx - 1));
                                return;
                            } else {
                                nuError.notEnoughOperands();
                            }
                        } else {
                            nuError.invalidOperand(idx);
                        }
                    } else {
                        nuError.notEnoughOperands();
                    }
                },
                ROLL: function () {
                    var len = vcpu.cs.length(), shift, count, removed, split;
                    if (len > 1) {
                        shift = vcpu.cs.pop();
                        if (typeof shift === 'number' &&
                            shift === Math.round(shift)) {
                            count = vcpu.cs.pop();
                            if (typeof count === 'number' &&
                                count >= 0 &&
                                count === Math.round(count)) {
                                len -= 2;
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
                            } else {
                                nuError.invalidOperand(count, shift);
                            }
                        } else {
                            nuError.invalidOperand(shift);
                        }
                    } else {
                        nuError.notEnoughOperands();
                    }
                },
                CLONE: function () {
                    var len = vcpu.cs.length(), thing, thingT;
                    if (len > 0) {
                        thing = vcpu.cs.index(len - 1);
                        thingT = typeof thing;
                        if (thingT === 'number' ||
                            thingT === 'boolean' ||
                            thing === types.isLexicalAddress(thing) ||
                            thing === types.undef ||
                            thing === types.mark) {
                            vcpu.cs.push(thing);
                            return;
                        } else if (thing.clone && Function === thing.clone.constructor) {
                            vcpu.cs.push(thing.clone());
                            return;
                        } else {
                            nuError.internalError();
                        }
                    } else {
                        nuError.notEnoughOperands();
                    }
                },
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
