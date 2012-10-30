(function (define) {
    define(function () {

        'use strict';

        return function (vcpu, ops) {
            Object.defineProperties(
                ops,
                {
                    PUSH: {value: function () {
                        vcpu.cs.push(vcpu.cs.ip.fetch());
                        return undefined;
                    }},
                    POP: {value: function () {
                        if (vcpu.cs.length() > 0) {
                            return vcpu.cs.pop();
                        } else {
                            throw "NOT ENOUGH OPERANDS (POP)"; // TODO interrupt handler
                        }
                    }},
                    DUPLICATE: {value: function () {
                        var len = vcpu.cs.length();
                        if (len > 0) {
                            vcpu.cs.push(vcpu.cs.copy(len - 1));
                            return undefined;
                        } else {
                            throw "NOT ENOUGH OPERANDS (DUPLICATE)"; // TODO interrupt handler
                        }
                    }},
                    EXCHANGE: {value: function () {
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
                    }},
                    COUNT: {value: function () {
                        vcpu.cs.push(vcpu.cs.length());
                        return undefined;
                    }},
                    COPY: {value: function () {
                        var len = vcpu.cs.length(), count, idx;
                        if (len > 0) {
                            count = vcpu.cs.pop();
                            len -= 1;
                            if (len >= count) {
                                for (idx = len - count; idx < len; idx += 1) {
                                    vcpu.cs.push(vcpu.cs.copy(idx));
                                }
                                return undefined;
                            } else {
                                throw "NOT ENOUGH OPERANDS (COPY)"; // TODO interrupt handler
                            }
                        } else {
                            throw "NOT ENOUGH OPERANDS (COPY)"; // TODO interrupt handler
                        }
                    }},
                    INDEX: {value: function () {
                        var len = vcpu.cs.length(), idx;
                        if (len > 0) {
                            idx = vcpu.cs.pop();
                            len -= 1;
                            if (len > idx) {
                                vcpu.cs.push(vcpu.cs.copy(len - idx - 1));
                                return undefined;
                            } else {
                                throw "NOT ENOUGH OPERANDS (INDEX)"; // TODO interrupt handler
                            }
                        } else {
                            throw "NOT ENOUGH OPERANDS (INDEX)"; // TODO interrupt handler
                        }
                    }},
                    ROLL: {value: function () {
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
                                removed.splice(shift).concat(removed).forEach(function (elem) {
                                    vcpu.cs.push(elem);
                                });
                                return undefined;
                            } else {
                                throw "NOT ENOUGH OPERANDS (ROLL)"; // TODO interrupt handler
                            }
                        } else {
                            throw "NOT ENOUGH OPERANDS (ROLL)"; // TODO interrupt handler
                        }
                    }},
                    CLEAR: {value: function () {
                        vcpu.cs.clear();
                        return undefined;
                    }}
                });
            return undefined;
        };

    });
}(typeof define === 'function' ? define : function (factory) { module.exports = factory(); }));
