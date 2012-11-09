(function (define) {
    define(function () {

        'use strict';

        var types = require('../types'),
            segmentTypes = require('../segment');

        return function (vcpu) {
            return {
                PUSH: function () {
                    var op = vcpu.cs.ip.fetchAndInc();
                    if (op === segmentTypes.segmentExhausted) {
                        throw "NOT ENOUGH OPERANDS (PUSH)"; // TODO interrupt handler
                    } else {
                        vcpu.cs.push(op);
                        return undefined;
                    }
                },
                POP: function () {
                    if (vcpu.cs.length() > 0) {
                        return vcpu.cs.pop();
                    } else {
                        throw "NOT ENOUGH OPERANDS (POP)"; // TODO interrupt handler
                    }
                },
                DUPLICATE: function () {
                    var len = vcpu.cs.length();
                    if (len > 0) {
                        vcpu.cs.push(vcpu.cs.index(len - 1));
                        return undefined;
                    } else {
                        throw "NOT ENOUGH OPERANDS (DUPLICATE)"; // TODO interrupt handler
                    }
                },
                EXCHANGE: function () {
                    var len = vcpu.cs.length(), tmp;
                    if (len > 1) {
                        len -= 1;
                        tmp = vcpu.cs.index(len);
                        vcpu.cs.store(len, vcpu.cs.index(len - 1));
                        vcpu.cs.store(len - 1, tmp);
                        return undefined;
                    } else {
                        throw "NOT ENOUGH OPERANDS (EXCHANGE)"; // TODO interrupt handler
                    }
                },
                COUNT: function () {
                    vcpu.cs.push(vcpu.cs.length());
                    return undefined;
                },
                COPY: function () {
                    var len = vcpu.cs.length(), count, idx;
                    if (len > 0) {
                        count = vcpu.cs.pop();
                        len -= 1;
                        if (len >= count) {
                            for (idx = len - count; idx < len; idx += 1) {
                                vcpu.cs.push(vcpu.cs.index(idx));
                            }
                            return undefined;
                        } else {
                            throw "NOT ENOUGH OPERANDS (COPY)"; // TODO interrupt handler
                        }
                    } else {
                        throw "NOT ENOUGH OPERANDS (COPY)"; // TODO interrupt handler
                    }
                },
                INDEX: function () {
                    var len = vcpu.cs.length(), idx;
                    if (len > 0) {
                        idx = vcpu.cs.pop();
                        len -= 1;
                        if (len > idx) {
                            vcpu.cs.push(vcpu.cs.index(len - idx - 1));
                            return undefined;
                        } else {
                            throw "NOT ENOUGH OPERANDS (INDEX)"; // TODO interrupt handler
                        }
                    } else {
                        throw "NOT ENOUGH OPERANDS (INDEX)"; // TODO interrupt handler
                    }
                },
                ROLL: function () {
                    var len = vcpu.cs.length(), shift, count, removed, split;
                    if (len > 1) {
                        shift = vcpu.cs.pop();
                        count = vcpu.cs.pop();
                        len -= 2;
                        if (len >= count) {
                            removed = vcpu.cs.clear(len - count);
                            if (shift > 0) {
                                shift = - (shift % count);
                            } else if (shift < 0) {
                                shift = Math.abs(shift) % count;
                            }
                            vcpu.cs.appendArray(removed.splice(shift).concat(removed));
                            return undefined;
                        } else {
                            throw "NOT ENOUGH OPERANDS (ROLL)"; // TODO interrupt handler
                        }
                    } else {
                        throw "NOT ENOUGH OPERANDS (ROLL)"; // TODO interrupt handler
                    }
                },
                CLONE: function () {
                    var len = vcpu.cs.length(), thing, thingT;
                    if (len > 0) {
                        thing = vcpu.cs.index(len - 1);
                        thingT = typeof thing;
                        if (thingT === 'number' ||
                            thingT === 'boolean' ||
                            thingT === 'string' ||
                            thing === types.isLexicalAddress(thing) ||
                            thing === types.undef ||
                            thing === types.mark) {
                            vcpu.cs.push(thing);
                            return undefined;
                        } else if (thing.clone && Function === thing.clone.constructor) {
                            vcpu.cs.push(thing.clone());
                            return undefined;
                        } else {
                            throw "INTERNAL ERROR (CLONE)"; // TODO interrupt handler
                        }
                    } else {
                        throw "NOT ENOUGH OPERANDS (CLONE)"; // TODO interrupt handler
                    }
                },
                CLEAR: function () {
                    vcpu.cs.clear();
                    return undefined;
                },
                TRUE: function () {
                    vcpu.cs.push(true);
                    return undefined;
                },
                FALSE: function () {
                    vcpu.cs.push(false);
                    return undefined;
                },
                UNDEF: function () {
                    vcpu.cs.push(types.undef);
                    return undefined;
                }
            };
        };

    });
}(typeof define === 'function' ? define : function (factory) { module.exports = factory(); }));
