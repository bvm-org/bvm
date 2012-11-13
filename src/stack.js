(function (define) {
    define(function () {

        'use strict';

        var id = {},
            nuArray = require('./array'),
            undef,
            stackTemplate = {
                id:        {value: id},
                dps:       {value: undef, writable: true},
                lps:       {value: undef},
                lsl:       {value: undef},
                ip:        {value: undef},
                segment:   {value: undef},
                clone:     {value: function (cloneStack) {
                    var stack = Object.getPrototypeOf(this);
                    return adornStackOps(
                        cloneStack ? stack.clone() : stack,
                        this.dps, this.segment, this.ip.clone());
                }},
                toJSON:    {value: function () {
                    return {type: 'stack',
                            dps: this.dps,
                            lps: this.lps,
                            lsl: this.lsl,
                            ip: this.ip,
                            contents: Object.getPrototypeOf(this)};
                }}
            }, nuStack;

        // segment here is the new segment being entered.
        nuStack = function (stackBase, oldStack, segment, index) {
            return adornStackOps(nuArray(stackBase), oldStack, segment, segment.nuIP(index));
        }

        function adornStackOps (stack, oldStack, segment, ip) {
            stackTemplate.dps.value = oldStack;
            stackTemplate.lps.value = segment.ls;
            stackTemplate.lsl.value = segment.ls ? segment.ls.lsl + 1 : 0;
            stackTemplate.ip.value = ip;
            stackTemplate.segment.value = segment;
            return Object.create(stack, stackTemplate);
        }

        nuStack.isStack = function (thing) {
            return thing &&
                typeof thing === 'object' &&
                id === thing.id;
        };

        return nuStack;

    });
}(typeof define === 'function' ? define : function (factory) { module.exports = factory(); }));
