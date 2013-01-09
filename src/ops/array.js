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
                    var len = vcpu.cs.length(), mark = vcpu.cs.lastIndexOf(types.mark),
                        removed, allChars, idx;
                    if (mark === -1) {
                        nuError.notEnoughOperands();
                    } else {
                        removed = vcpu.cs.clear(mark);
                        removed.shift(); // drop the initial mark
                        for (len = removed.length, allChars = len > 0, idx = 0;
                             allChars && idx < len; idx += 1) {
                            allChars = allChars && types.isChar(removed[idx]);
                        }
                        if (allChars) {
                            vcpu.cs.push(removed.reduce(
                                function (acc, cur) { return acc + cur.ch; }, ''));
                        } else {
                            vcpu.cs.push(nuArray(removed));
                        }
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
                        } else if (types.isString(ary)) {
                            vcpu.cs.appendArray(utils.string.toArray(ary).array);
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
                        if (typeof idx === 'number' && idx >= 0) {
                            if (nuArray.isArray(array)) {
                                array.store(idx, value);
                                vcpu.cs.push(array);
                                return;
                            } else if (types.isString(array)) {
                                if (types.isChar(value) && idx <= array.length) {
                                    lhs = array.substring(0, idx);
                                    rhs = array.substring(idx + 1);
                                    vcpu.cs.push('' + lhs + value.ch + rhs);
                                    return;
                                } else {
                                    array = utils.string.toArray(array);
                                    array.store(idx, value);
                                    vcpu.cs.push(array);
                                    return;
                                }
                            }
                        }
                        nuError.invalidOperand(array, idx);
                    } else {
                        nuError.notEnoughOperands();
                    }
                },
                ARRAY_LOAD: function () {
                    var array, idx;
                    if (vcpu.cs.length() > 1) {
                        idx = vcpu.cs.pop();
                        array = vcpu.cs.pop();
                        if (typeof idx === 'number' && idx >= 0) {
                            if (nuArray.isArray(array)) {
                                vcpu.cs.push(array);
                                vcpu.cs.push(array.index(idx));
                                return;
                            } else if (types.isString(array)) {
                                vcpu.cs.push(array);
                                if (idx >= array.length) {
                                    vcpu.cs.push(types.undef);
                                } else {
                                    vcpu.cs.push(types.nuChar(array.charAt(idx)));
                                }
                                return;
                            }
                        }
                        nuError.invalidOperand(array, idx);
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
                        } else if (types.isString(array)) {
                            vcpu.cs.push(array);
                            vcpu.cs.push(array.length);
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
                        if (typeof len === 'number' && len >= 0) {
                            if (nuArray.isArray(array)) {
                                array.length(len);
                                vcpu.cs.push(array);
                                return;
                            } else if (types.isString(array)) {
                                // this is likely wrong in the case
                                // where we need to make the
                                // array/string longer.
                                vcpu.cs.push(array.substring(0, len));
                                return;
                            }
                        }
                        nuError.invalidOperand(array, len);
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
