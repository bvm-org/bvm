(function (define) {
    define(function () {

        'use strict';

        var types = require('../types'),
            nuArray = require('../array'),
            nuSegment = require('../segment'),
            nuStack = require('../stack'),
            nuError = require('../errors'),
            utils = require('../utils'),
            nuOpcode = require('../opcode');

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
                ARRAY_EXPAND: nuOpcode(vcpu, [nuArray.isArray], function (ary) {
                    vcpu.cs.appendArray(ary.array);
                    return;
                }),
                ARRAY_NEW: function () {
                    vcpu.cs.push(nuArray());
                    return;
                },
                ARRAY_STORE: nuOpcode(
                    vcpu,
                    [nuArray.isArray, nuOpcode.tests.isNonNegativeInteger, nuOpcode.tests.any],
                    function (ary, idx, val) {
                        ary.store(idx, val);
                        vcpu.cs.push(ary);
                        return;
                    }),
                ARRAY_LOAD: nuOpcode(
                    vcpu,
                    [nuArray.isArray, nuOpcode.tests.isNonNegativeInteger],
                    function (ary, idx) {
                        vcpu.cs.push(ary);
                        vcpu.cs.push(ary.index(idx));
                        return;
                    }),
                ARRAY_LENGTH: nuOpcode(vcpu, [nuArray.isArray], function (ary) {
                    vcpu.cs.push(ary);
                    vcpu.cs.push(ary.length());
                    return;
                }),
                ARRAY_TRUNCATE: nuOpcode(
                    vcpu, [nuArray.isArray, nuOpcode.tests.isNonNegativeInteger],
                    function (ary, trunc) {
                        ary.length(trunc);
                        vcpu.cs.push(ary);
                        return;
                    }),
                ARRAY_PUSH: nuOpcode(vcpu, [nuArray.isArray, nuOpcode.tests.any],
                                     function (ary, val) {
                                         ary.push(val);
                                         vcpu.cs.push(ary);
                                         return;
                                     }),
                ARRAY_POP: nuOpcode(vcpu, [nuArray.isArray], function (ary) {
                    vcpu.cs.push(ary);
                    vcpu.cs.push(ary.pop());
                    return;
                }),
                ARRAY_UNSHIFT: nuOpcode(vcpu, [nuArray.isArray, nuOpcode.tests.any],
                                     function (ary, val) {
                                         ary.push(val);
                                         vcpu.cs.unshift(ary);
                                         return;
                                     }),
                ARRAY_SHIFT: nuOpcode(vcpu, [nuArray.isArray], function (ary) {
                    vcpu.cs.push(ary);
                    vcpu.cs.push(ary.shift());
                    return;
                }),
                ARRAY_MAP: nuOpcode(
                    vcpu, [nuArray.isArray, nuOpcode.tests.isExecutable],
                    function (ary, seg) {
                        var idx = 0,
                            len = ary.length(),
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
                                    if (vcpu.cs.length() > 0) {
                                        ary.store(idx, vcpu.cs.pop());
                                    }
                                    idx += 1;
                                    vcpu.cs.ip.set(0);
                                }
                            ]);
                        vcpu.cs.push(intermediateSeg);
                        this.EXEC();
                    }),
                ARRAY_FOLDL: nuOpcode(
                    vcpu, [nuArray.isArray, nuOpcode.tests.any, nuOpcode.tests.isExecutable],
                    function (ary, acc, seg) {
                        var idx = 0,
                            len = ary.length(),
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
                                    if (vcpu.cs.length() > 0) {
                                        acc = vcpu.cs.pop();
                                    }
                                    idx += 1;
                                    vcpu.cs.ip.set(0);
                                }
                            ]);
                        vcpu.cs.push(intermediateSeg);
                        this.EXEC();
                }),
                ARRAY_FOLDR: nuOpcode(
                    vcpu, [nuArray.isArray, nuOpcode.tests.any, nuOpcode.tests.isExecutable],
                    function (ary, acc, seg) {
                        var idx = ary.length() - 1,
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
                                    if (vcpu.cs.length() > 0) {
                                        acc = vcpu.cs.pop();
                                    }
                                    idx -= 1;
                                    vcpu.cs.ip.set(0);
                                }
                            ]);
                        vcpu.cs.push(intermediateSeg);
                        this.EXEC();
                    }),
                ARRAY_EQ: nuOpcode(vcpu, [nuArray.isArray, nuArray.isArray], function (a, b) {
                    var idx, len, eq;
                    if (a === b) {
                        vcpu.cs.push(true);
                        return;
                    } else if (a.length() === b.length()) {
                        for (len = a.length(), idx = 0, eq = true;
                             eq && idx < len; idx += 1) {
                            vcpu.cs.push(a.index(idx));
                            vcpu.cs.push(b.index(idx));
                            this.EQ();
                            eq = vcpu.cs.pop();
                        }
                        vcpu.cs.push(eq);
                        return;
                    } else {
                        vcpu.cs.push(false);
                        return;
                    }
                }),
                ARRAY_TO_SEG: nuOpcode(vcpu, [nuArray.isArray], function (ary) {
                    vcpu.cs.push(nuSegment(ary, vcpu.cs));
                    return;
                })
            };
        };

    });
}(typeof define === 'function' ? define : function (factory) { module.exports = factory(); }));
