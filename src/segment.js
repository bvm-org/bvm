(function (define) {
    define(function () {

        'use strict';

        var nuArray = require('./array'),
            types = require('./types'),
            segmentTypes = {},
            id = {},
            segmentExhausted = {};

        (function jsonSegment () {

            segmentTypes.json = function nuSegment (array, stackOfCurrentLexicalScope) {
                return adornSegmentFields(nuArray(array), stackOfCurrentLexicalScope);
            }

            function adornSegmentFields (segment, stackOfCurrentLexicalScope) {
                return Object.create(
                    segment,
                    {
                        id: {value: id},
                        ls: {value: stackOfCurrentLexicalScope},
                        nuIP: {value: function (index) {
                            return nuIP(this, index);
                        }},
                        nuSegment: {value: segmentTypes.json},
                        clone: {value: function () {
                            return adornSegmentFields(segment.clone(), this.ls);
                        }}
                    });
            }

            function nuIP (segment, index) {
                if (! index) {
                    index = 0;
                }
                return Object.create(
                    {},
                    {
                        fetch: {value: function () {
                            var op;
                            if (index >= segment.length()) {
                                return segmentExhausted;
                            } else {
                                op = segment.index(index);
                                index += 1;
                                if (Array.isArray(op)) {
                                    op = types.nuLexicalAddress(op[0], op[1]);
                                }
                                return op;
                            }
                        }},
                        set: {value: function (idx) {
                            if (typeof idx === 'number' &&
                                idx >= 0 && idx < segment.length()) {
                                index = idx;
                                return undefined;
                            } else {
                                throw "INVALID IP INDEX: " + idx; // TODO interrupt handler
                            }
                        }},
                        isExhausted: {value: function () {
                            return index >= segment.length();
                        }},
                        clone: {value: function () {
                            return nuIP(segment, index);
                        }}
                    });
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
