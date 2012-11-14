(function (define) {
    define(function () {

        'use strict';

        var types = require('../types'),
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
                        vcpu.cs.push(vcpu.cs.segment.nuSegment(removed, vcpu.cs));
                        return;
                    }
                }
            };
        };

    });
}(typeof define === 'function' ? define : function (factory) { module.exports = factory(); }));
