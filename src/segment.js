(function (define) {
    define(function () {

        'use strict';

        var nuArray = require('./array'),
            types = require('./types'),
            nuError = require('./errors'),
            id = {},
            segmentExhausted = {},
            undef,
            segmentTemplate = {
                id:        {value: id},
                ls:        {value: undef},
                nuIP:      {value: function (index) { return nuIP(this, index); }},
                clone:     {value: function () {
                    return adornSegmentFields(
                        Object.getPrototypeOf(this).clone(), this.ls);
                }},
                toJSON:    {value: function () {
                    return {type: 'segment',
                            ls: this.ls,
                            instructions: Object.getPrototypeOf(this)};
                }}},
            ipBase = Object.defineProperties(
                {},
                {
                    fetchAndInc: {value: function () {
                        var seg = this.segment, idx = this.index, op;
                        if (idx >= seg.length()) {
                            return segmentExhausted;
                        } else {
                            op = seg.index(idx);
                            this.index += 1;
                            if (Array.isArray(op)) {
                                return types.nuLexicalAddress(op[0], op[1]);
                            }
                            return op;
                        }
                    }},
                    set: {value: function (idx) {
                        if (typeof idx === 'number' &&
                            idx >= 0 && idx < this.segment.length()) {
                            this.index = idx;
                            return;
                        } else {
                            nuError.invalidOperand(idx);
                        }
                    }},
                    replaceMostRecent: {value: function (fun) {
                        return this.segment.store(this.index - 1, fun);
                    }},
                    isExhausted: {value: function () {
                        return this.index >= this.segment.length();
                    }},
                    clone: {value: function () {
                        return nuIP(this.segment, this.index);
                    }},
                    toJSON: {value: function () {
                        return {type: 'ip',
                                segment: this.segment,
                                index: this.index};
                    }}
                }),
            ipTemplate = {
                segment: {value: undef},
                index:   {value: undef, writable: true}
            },
            nuSegment;

        nuSegment = function (array, stackOfCurrentLexicalScope) {
            return adornSegmentFields(nuArray(array), stackOfCurrentLexicalScope);
        }

        function adornSegmentFields (segment, stackOfCurrentLexicalScope) {
            segmentTemplate.ls.value = stackOfCurrentLexicalScope;
            return Object.create(segment, segmentTemplate);
        }

        function nuIP (segment, index) {
            if (! index) {
                index = 0;
            }
            ipTemplate.segment.value = segment;
            ipTemplate.index.value = index;
            return Object.create(ipBase, ipTemplate);
        }

        nuSegment.isSegment = function (thing) {
            return thing &&
                typeof thing === 'object' &&
                id === thing.id;
        };

        nuSegment.segmentExhausted = segmentExhausted;

        return nuSegment;
    });
}(typeof define === 'function' ? define : function (factory) { module.exports = factory(); }));
