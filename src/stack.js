(function (define) {
    define(function () {

        'use strict';

        var id = {},
            nuArray = require('./array'),
            nuStack;

        // segment here is the new segment being entered.
        nuStack = function (stackBase, oldStack, segment, index) {
            return Object.create(
                nuArray(stackBase),
                {
                    id: {value: id},
                    dps: {value: oldStack},
                    lps: {value: segment.ls},
                    lsl: {value: segment.ls ? segment.ls.lsl + 1 : 0},
                    ip: {value: segment.nuIP(index)},
                    nuSegment: {value: segment.nuSegment},
                    clone: {value: function () {
                        return nuStack(stack.clone(), this.dps, segment, this.ip.index);
                    }}
                });
        }

        nuStack.isStack = function (thing) {
            return thing &&
                typeof thing === 'object' &&
                id === thing.id;
        };

        return nuStack;

    });
}(typeof define === 'function' ? define : function (factory) { module.exports = factory(); }));
