(function (define) {
    define(function () {

        'use strict';

        var types = require('../types'),
            nuSegment = require('../segment'),
            nuError = require('../errors'),
            nuOpcode = require('../opcode');

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
                SEG_TO_ARRAY: nuOpcode(vcpu, [nuSegment.isSegment], function (seg) {
                    vcpu.cs.push(seg.asArray());
                    return;
                })
            };
        };

    });
}(typeof define === 'function' ? define : function (factory) { module.exports = factory(); }));
