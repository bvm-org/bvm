(function (define) {
    define(function () {

        'use strict';

        var id = {},
            nuArray = require('./array'),
            undef,
            stackTemplate = {
                id:        {value: id},
                ts:        {value: undef, writable: true},
                dps:       {value: undef, writable: true},
                lps:       {value: undef},
                lsl:       {value: undef},
                ip:        {value: undef},
                segment:   {value: undef},
                clone:     {value: function (shareArray) {
                    var array = Object.getPrototypeOf(this);
                    return adornStackOps(
                        shareArray ? array : array.clone(),
                        this.ts, this.dps, this.segment, this.ip.clone());
                }},
                toJSON:    {value: function () {
                    return {type: 'stack',
                            ts: this.ts,
                            dps: this.dps,
                            lps: this.lps,
                            lsl: this.lsl,
                            ip: this.ip,
                            contents: Object.getPrototypeOf(this)};
                }}
            }, nuStack;

        // segment here is the new segment being entered.
        nuStack = function (arrayBase, takeStack, oldStack, segment, index) {
            return adornStackOps(nuArray(arrayBase), takeStack, oldStack, segment, segment.nuIP(index));
        }

        function adornStackOps (array, takeStack, oldStack, segment, ip) {
            stackTemplate.ts.value = takeStack;
            stackTemplate.dps.value = oldStack;
            stackTemplate.lps.value = segment.ls;
            stackTemplate.lsl.value = segment.ls ? segment.ls.lsl + 1 : 0;
            stackTemplate.ip.value = ip;
            stackTemplate.segment.value = segment;
            return Object.create(array, stackTemplate);
        }

        nuStack.isStack = function (thing) {
            return thing &&
                typeof thing === 'object' &&
                id === thing.id;
        };

        return nuStack;

    });
}(typeof define === 'function' ? define : function (factory) { module.exports = factory(); }));
