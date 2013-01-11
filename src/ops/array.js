(function (define) {
    define(function () {

        'use strict';

        var types = require('../types'),
            nuArray = require('../array'),
            nuSegment = require('../segment'),
            nuError = require('../errors'),
            utils = require('../utils');

        return function (vcpu) {
            return {
                ARRAY_START: function () {
                    this.MARK();
                    return;
                },
                ARRAY_END: function () {
                    var mark = vcpu.cs.lastIndexOf(types.mark), removed;
                    if (mark === -1) {
                        nuError.notEnoughOperands();
                    } else {
                        removed = vcpu.cs.clear(mark);
                        removed.shift(); // drop the initial mark
                        vcpu.cs.push(nuArray(removed));
                        return;
                    }
                },
                ARRAY_EXPAND: function () {
                    var ary, idx, len;
                    if (vcpu.cs.length() > 0) {
                        ary = vcpu.cs.pop();
                        if (nuArray.isArray(ary)) {
                            vcpu.cs.appendArray(ary.array);
                            return;
                        } else {
                            nuError.invalidOperand(ary);
                        }
                    } else {
                        nuError.notEnoughOperands();
                    }
                },
                ARRAY_NEW: function () {
                    vcpu.cs.push(nuArray());
                    return;
                },
                ARRAY_STORE: function () {
                    var array, idx, value, lhs, rhs, i;
                    if (vcpu.cs.length() > 2) {
                        value = vcpu.cs.pop();
                        idx = vcpu.cs.pop();
                        array = vcpu.cs.pop();
                        if (nuArray.isArray(array) && typeof idx === 'number' && idx >= 0) {
                            array.store(idx, value);
                            vcpu.cs.push(array);
                            return;
                        } else {
                            nuError.invalidOperand(array, idx);
                        }
                    } else {
                        nuError.notEnoughOperands();
                    }
                },
                ARRAY_LOAD: function () {
                    var array, idx;
                    if (vcpu.cs.length() > 1) {
                        idx = vcpu.cs.pop();
                        array = vcpu.cs.pop();
                        if (nuArray.isArray(array) && typeof idx === 'number' && idx >= 0) {
                            vcpu.cs.push(array);
                            vcpu.cs.push(array.index(idx));
                            return;
                        } else {
                            nuError.invalidOperand(array, idx);
                        }
                    } else {
                        nuError.notEnoughOperands();
                    }
                },
                ARRAY_LENGTH: function () {
                    var array;
                    if (vcpu.cs.length() > 0) {
                        array = vcpu.cs.pop();
                        if (nuArray.isArray(array)) {
                            vcpu.cs.push(array);
                            vcpu.cs.push(array.length());
                            return;
                        } else {
                            nuError.invalidOperand(array);
                        }
                    } else {
                        nuError.notEnoughOperands();
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
                            return;
                        } else {
                            nuError.invalidOperand(array, len);
                        }
                    } else {
                        nuError.notEnoughOperands();
                    }
                },
                ARRAY_TO_SEG: function () {
                    var ary;
                    if (vcpu.cs.length() > 0) {
                        ary = vcpu.cs.pop();
                        if (nuArray.isArray(ary)) {
                            vcpu.cs.push(nuSegment(ary, vcpu.cs));
                        } else {
                            nuError.invalidOperand(ary);
                        }
                    } else {
                        nuError.notEnoughOperands();
                    }
                }
            };
        };

    });
}(typeof define === 'function' ? define : function (factory) { module.exports = factory(); }));
