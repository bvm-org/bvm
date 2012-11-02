(function (define) {
    define(function () {

        'use strict';

        var id = {},
            nuArray = require('./array'),
            nuStack;

        // segment here is the new segment being entered.
        nuStack = function (stackBase, oldStack, segment, index) {
            return adornStackOps(nuArray(stackBase), oldStack, segment, segment.nuIP(index));
        }

        function adornStackOps (stack, oldStack, segment, ip) {
            return Object.create(
                stack,
                {
                    id: {value: id},
                    dps: {value: oldStack, writable: true},
                    lps: {value: segment.ls},
                    lsl: {value: segment.ls ? segment.ls.lsl + 1 : 0},
                    ip: {value: ip},
                    nuSegment: {value: segment.nuSegment},
                    clone: {value: function (cloneStack) {
                        return adornStackOps(cloneStack ? stack.clone() : stack,
                                             this.dps, segment, this.ip.clone());
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
