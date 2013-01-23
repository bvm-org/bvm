(function (define) {
    define(function () {

        'use strict';

        var types = require('../types'),
            nuArray = require('../array'),
            nuSegment = require('../segment'),
            nuStack = require('../stack'),
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
                ARRAY_PUSH: function () {
                    var ary, val;
                    if (vcpu.cs.length() > 1) {
                        val = vcpu.cs.pop();
                        ary = vcpu.cs.pop();
                        if (nuArray.isArray(ary)) {
                            ary.push(val);
                            vcpu.cs.push(ary);
                            return;
                        } else {
                            nuError.invalidOperand(ary, val);
                        }
                    } else {
                        nuError.notEnoughOperands();
                    }
                },
                ARRAY_POP: function () {
                    var ary;
                    if (vcpu.cs.length() > 0) {
                        ary = vcpu.cs.pop();
                        if (nuArray.isArray(ary)) {
                            vcpu.cs.push(ary);
                            vcpu.cs.push(ary.pop());
                            return;
                        } else {
                            nuError.invalidOperand(ary);
                        }
                    } else {
                        nuError.notEnoughOperands();
                    }
                },
                ARRAY_UNSHIFT: function () {
                    var ary, val;
                    if (vcpu.cs.length() > 1) {
                        val = vcpu.cs.pop();
                        ary = vcpu.cs.pop();
                        if (nuArray.isArray(ary)) {
                            ary.unshift(val);
                            vcpu.cs.push(ary);
                            return;
                        } else {
                            nuError.invalidOperand(ary, val);
                        }
                    } else {
                        nuError.notEnoughOperands();
                    }
                },
                ARRAY_SHIFT: function () {
                    var ary;
                    if (vcpu.cs.length() > 0) {
                        ary = vcpu.cs.pop();
                        if (nuArray.isArray(ary)) {
                            vcpu.cs.push(ary);
                            vcpu.cs.push(ary.shift());
                            return;
                        } else {
                            nuError.invalidOperand(ary);
                        }
                    } else {
                        nuError.notEnoughOperands();
                    }
                },
                ARRAY_MAP: function () {
                    var seg, ary, idx, len, intermediateSeg;
                    if (vcpu.cs.length() > 1) {
                        seg = vcpu.cs.pop();
                        ary = vcpu.cs.pop();
                        if (nuArray.isArray(ary)) {
                            idx = 0;
                            len = ary.length();
                            intermediateSeg = nuSegment([
                                function () {
                                    vcpu.cs.clear();
                                    if (idx < len) {
                                        vcpu.cs.push(ary.index(idx));
                                        vcpu.cs.push(seg);
                                        this.EXEC();
                                    } else {
                                        vcpu.cs.push(ary);
                                        vcpu.cs.push(1);
                                        this.RETURN();
                                    }
                                }.bind(this),
                                function () {
                                    if (idx < len) {
                                        if (vcpu.cs.length() > 0) {
                                            ary.store(idx, vcpu.cs.pop());
                                        }
                                        idx += 1;
                                        vcpu.cs.ip.set(0);
                                    }
                                }
                            ]);
                            vcpu.cs.push(intermediateSeg);
                            this.EXEC();
                        } else {
                            nuError.invalidOperand(ary, seg);
                        }
                    } else {
                        nuError.notEnoughOperands();
                    }
                },
                ARRAY_FOLDL: function () {
                    var acc, seg, ary, idx, len, intermediateSeg;
                    if (vcpu.cs.length() > 2) {
                        seg = vcpu.cs.pop();
                        acc = vcpu.cs.pop();
                        ary = vcpu.cs.pop();
                        if (nuArray.isArray(ary)) {
                            idx = 0;
                            len = ary.length();
                            intermediateSeg = nuSegment([
                                function () {
                                    vcpu.cs.clear();
                                    if (idx < len) {
                                        vcpu.cs.push(acc);
                                        vcpu.cs.push(ary.index(idx));
                                        vcpu.cs.push(seg);
                                        this.EXEC();
                                    } else {
                                        vcpu.cs.push(ary);
                                        vcpu.cs.push(acc);
                                        vcpu.cs.push(2);
                                        this.RETURN();
                                    }
                                }.bind(this),
                                function () {
                                    if (idx < len) {
                                        if (vcpu.cs.length() > 0) {
                                            acc = vcpu.cs.pop();
                                        }
                                        idx += 1;
                                        vcpu.cs.ip.set(0);
                                    }
                                }
                            ]);
                            vcpu.cs.push(intermediateSeg);
                            this.EXEC();
                        } else {
                            nuError.invalidOperand(ary, acc, seg);
                        }
                    } else {
                        nuError.notEnoughOperands();
                    }
                },
                ARRAY_FOLDR: function () {
                    var acc, seg, ary, idx, len, intermediateSeg;
                    if (vcpu.cs.length() > 2) {
                        seg = vcpu.cs.pop();
                        acc = vcpu.cs.pop();
                        ary = vcpu.cs.pop();
                        if (nuArray.isArray(ary)) {
                            idx = ary.length() - 1;
                            intermediateSeg = nuSegment([
                                function () {
                                    vcpu.cs.clear();
                                    if (idx > -1) {
                                        vcpu.cs.push(acc);
                                        vcpu.cs.push(ary.index(idx));
                                        vcpu.cs.push(seg);
                                        this.EXEC();
                                    } else {
                                        vcpu.cs.push(ary);
                                        vcpu.cs.push(acc);
                                        vcpu.cs.push(2);
                                        this.RETURN();
                                    }
                                }.bind(this),
                                function () {
                                    if (idx > -1) {
                                        if (vcpu.cs.length() > 0) {
                                            acc = vcpu.cs.pop();
                                        }
                                        idx -= 1;
                                        vcpu.cs.ip.set(0);
                                    }
                                }
                            ]);
                            vcpu.cs.push(intermediateSeg);
                            this.EXEC();
                        } else {
                            nuError.invalidOperand(ary, acc, seg);
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
