(function (define) {
    define(function () {

        'use strict';

        var types = require('../types');
        var nuArray = require('../array');

        return function (vcpu) {
            return {
                ARRAY_START: function () {
                    this.MARK();
                    return undefined;
                },
                ARRAY_END: function () {
                    var len = vcpu.cs.length(), mark = vcpu.cs.lastIndexOf(types.mark),
                    removed;
                    if (mark === -1) {
                        throw "INVALID OPERAND (ARRAY_END)"; // TODO interrupt handler
                    } else {
                        removed = vcpu.cs.clear(mark);
                        removed.shift(); // drop the initial mark
                        vcpu.cs.push(nuArray(removed));
                        return undefined;
                    }
                },
                ARRAY_NEW: function () {
                    vcpu.cs.push(nuArray());
                    return undefined;
                },
                ARRAY_STORE: function () {
                    var array, idx, value;
                    if (vcpu.cs.length() > 2) {
                        value = vcpu.cs.pop();
                        idx = vcpu.cs.pop();
                        array = vcpu.cs.pop();
                        if (nuArray.isArray(array) && typeof idx === 'number') {
                            array.store(idx, value);
                            vcpu.cs.push(array);
                            return undefined;
                        } else {
                            throw "INVALID OPERAND (ARRAY_STORE)"; // TODO interrupt handler
                        }
                    } else {
                        throw "NOT ENOUGH OPERANDS (ARRAY_STORE)"; // TODO interrupt handler
                    }
                },
                ARRAY_LOAD: function () {
                    var array, idx;
                    if (vcpu.cs.length() > 1) {
                        idx = vcpu.cs.pop();
                        array = vcpu.cs.pop();
                        if (nuArray.isArray(array) && typeof idx === 'number') {
                            vcpu.cs.push(array);
                            vcpu.cs.push(array.index(idx));
                            return undefined;
                        } else {
                            throw "INVALID OPERAND (ARRAY_LOAD)"; // TODO interrupt handler
                        }
                    } else {
                        throw "NOT ENOUGH OPERANDS (ARRAY_LOAD)"; // TODO interrupt handler
                    }
                },
                ARRAY_LENGTH: function () {
                    var array;
                    if (vcpu.cs.length() > 0) {
                        array = vcpu.cs.pop();
                        if (nuArray.isArray(array)) {
                            vcpu.cs.push(array);
                            vcpu.cs.push(array.length());
                            return undefined;
                        } else {
                            throw "INVALID OPERAND (ARRAY_LENGTH)"; // TODO interrupt handler
                        }
                    } else {
                        throw "NOT ENOUGH OPERANDS (ARRAY_LENGTH)"; // TODO interrupt handler
                    }
                },
                ARRAY_TRUNCATE: function () {
                    var len, array;
                    if (vcpu.cs.length() > 1) {
                        len = vcpu.cs.pop();
                        array = vcpu.cs.pop();
                        if (nuArray.isArray(array) && typeof len === 'number' && len >= 0) {
                            array.length(len);
                            vcpu.cs.push(array);
                            return undefined;
                        } else {
                            throw "INVALID OPERAND (ARRAY_TRUNCATE)"; // TODO interrupt handler
                        }
                    } else {
                        throw "NOT ENOUGH OPERANDS (ARRAY_TRUNCATE)"; // TODO interrupt handler
                    }
                }
            };
        };

    });
}(typeof define === 'function' ? define : function (factory) { module.exports = factory(); }));
