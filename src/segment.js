(function (define) {
    define(function () {

        'use strict';

        var nuArray = require('./array'),
            types = require('./types'),
            nuError = require('./errors'),
            segmentTypes = {},
            id = {},
            segmentExhausted = {},
            undef;

        (function jsonSegment () {

            segmentTypes.json = function nuSegment (array, stackOfCurrentLexicalScope) {
                return adornSegmentFields(nuArray(array), stackOfCurrentLexicalScope);
            }

            var segmentTemplate = {
                id:        {value: id},
                ls:        {value: undef},
                nuIP:      {value: function (index) { return nuIP(this, index); }},
                nuSegment: {value: segmentTypes.json},
                clone:     {value: function () {
                    return adornSegmentFields(
                        Object.getPrototypeOf(this).clone(), this.ls);
                }},
                toJSON:    {value: function () {
                    return {type: 'segment',
                            ls: this.ls,
                            instructions: Object.getPrototypeOf(this)};
                }}
            }, ipTemplate = {
                fetchAndInc:       {value: undef},
                set:               {value: undef},
                replaceMostRecent: {value: undef},
                isExhausted:       {value: undef},
                clone:             {value: undef},
                toJSON:            {value: undef}
            };

            function adornSegmentFields (segment, stackOfCurrentLexicalScope) {
                segmentTemplate.ls.value = stackOfCurrentLexicalScope;
                return Object.create(segment, segmentTemplate);
            }

            function nuIP (segment, index) {
                if (! index) {
                    index = 0;
                }
                ipTemplate.fetchAndInc.value = function () {
                    var op;
                    if (index >= segment.length()) {
                        return segmentExhausted;
                    } else {
                        op = segment.index(index);
                        index += 1;
                        if (Array.isArray(op)) {
                            return types.nuLexicalAddress(op[0], op[1]);
                        }
                        return op;
                    }
                };
                ipTemplate.set.value = function (idx) {
                    if (typeof idx === 'number' &&
                        idx >= 0 && idx < segment.length()) {
                        index = idx;
                        return;
                    } else {
                        nuError.invalidOperand(idx);
                    }
                };
                ipTemplate.replaceMostRecent.value = function (fun) {
                    return segment.store(index - 1, fun);
                };
                ipTemplate.isExhausted.value = function () {
                    return index >= segment.length();
                };
                ipTemplate.clone.value = function () {
                    return nuIP(segment, index);
                };
                ipTemplate.toJSON.value = function () {
                    return {type: 'ip',
                            segment: segment,
                            index: index};
                };
                return Object.defineProperties({}, ipTemplate);
            }

        }());

        (function binarySegment () {
            // TODO
        }());

        segmentTypes.isSegment = function (thing) {
            return thing &&
                typeof thing === 'object' &&
                id === thing.id;
        };

        segmentTypes.segmentExhausted = segmentExhausted;

        return segmentTypes;
    });
}(typeof define === 'function' ? define : function (factory) { module.exports = factory(); }));
