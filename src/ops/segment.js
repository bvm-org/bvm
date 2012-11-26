(function (define) {
    define(function () {

        'use strict';

        var types = require('../types'),
            nuSegment = require('../segment'),
            nuError = require('../errors');

        return function (vcpu) {
            return {
                SEG_START: function () {
                    this.MARK();
                    return;
                },
                SEG_END: function () {
                    var len = vcpu.cs.length(), mark = vcpu.cs.lastIndexOf(types.mark),
                        removed;
                    if (mark === -1) {
                        nuError.notEnoughOperands();
                    } else {
                        removed = vcpu.cs.clear(mark);
                        removed.shift(); // drop the initial mark
                        vcpu.cs.push(nuSegment(removed, vcpu.cs));
                        return;
                    }
                },
                SEG_TO_ARRAY: function () {
                    var seg;
                    if (vcpu.cs.length() > 0) {
                        seg = vcpu.cs.pop();
                        if (nuSegment.isSegment(seg)) {
                            vcpu.cs.push(seg.asArray());
                        } else {
                            nuError.invalidOperand(seg);
                        }
                    } else {
                        nuError.notEnoughOperands();
                    }
                }
            };
        };

    });
}(typeof define === 'function' ? define : function (factory) { module.exports = factory(); }));
