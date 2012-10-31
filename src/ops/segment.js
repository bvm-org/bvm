(function (define) {
    define(function () {

        'use strict';

        var types = require('../types');

        return function (vcpu, ops) {
            var arity = undefined;
            Object.defineProperties(
                ops,
                {
                    SEG_START: {value: function () {
                        if (arity !== undefined) {
                            throw "INTERNAL ERROR (SEG_START)";
                        }
                        arity = vcpu.cs.pop();
                        if (typeof arity !== 'number') {
                            throw "INVALID OPERAND (SEG_START)";
                        }
                        this.MARK();
                        return undefined;
                    }},
                    SEG_END: {value: function () {
                        var len = vcpu.cs.length(), mark = vcpu.cs.lastIndexOf(types.mark),
                            ar = arity, removed;
                        arity = undefined;
                        if (mark === -1) {
                            throw "INVALID OPERAND (SEG_END)"; // TODO interrupt handler
                        } else {
                            removed = vcpu.cs.clear(mark);
                            removed.shift(); // drop the initial mark
                            vcpu.cs.push(vcpu.cs.nuSegment(removed, ar, vcpu.cs));
                            return undefined;
                        }
                    }}
                });
            return undefined;
        };

    });
}(typeof define === 'function' ? define : function (factory) { module.exports = factory(); }));
