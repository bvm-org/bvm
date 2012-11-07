(function (define) {
    define(function () {

        'use strict';

        var types = require('../types');

        return function (vcpu) {
            return {
                SEG_START: function () {
                    this.MARK();
                    return undefined;
                },
                SEG_END: function () {
                    var len = vcpu.cs.length(), mark = vcpu.cs.lastIndexOf(types.mark),
                    removed;
                    if (mark === -1) {
                        throw "INVALID OPERAND (SEG_END)"; // TODO interrupt handler
                    } else {
                        removed = vcpu.cs.clear(mark);
                        removed.shift(); // drop the initial mark
                        vcpu.cs.push(vcpu.cs.nuSegment(removed, vcpu.cs));
                        return undefined;
                    }
                }
            };
        };

    });
}(typeof define === 'function' ? define : function (factory) { module.exports = factory(); }));
