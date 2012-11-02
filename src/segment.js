(function (define) {
    define(function () {

        'use strict';

        var nuArray = require('./array'),
            types = require('./types'),
            segmentTypes = {},
            id = {},
            segmentExhausted = {};

        (function jsonSegment () {

            segmentTypes.json = function nuSegment (array, arity, stackOfCurrentLexicalScope) {
                if (! arity) {
                    arity = 0;
                }
                return adornSegmentFields(nuArray(array), arity, stackOfCurrentLexicalScope);
            }

            function adornSegmentFields (segment, arity, stackOfCurrentLexicalScope) {
                return Object.create(
                    segment,
                    {
                        id: {value: id},
                        ls: {value: stackOfCurrentLexicalScope},
                        arity: {value: arity},
                        nuIP: {value: function (index) {
                            return nuIP(this, index);
                        }},
                        nuSegment: {value: segmentTypes.json},
                        clone: {value: function () {
                            return adornSegmentFields(segment.clone(), this.arity, this.ls);
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
                                return op;
                            }
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
