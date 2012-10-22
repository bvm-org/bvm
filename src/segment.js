(function (define) {
    define(function () {

        'use strict';

        var nuArray = require('./array'),
            segmentTypes = {};

        (function jsonSegment () {

            segmentTypes.json = function (array, arity, stackOfCurrentLexicalScope) {
                if (! arity) {
                    arity = 0;
                }
                return adornSegmentFields(nuArray(array), arity, stackOfCurrentLexicalScope);
            }

            function adornSegmentFields (segment, arity, stackOfCurrentLexicalScope) {
                return Object.create(
                    segment,
                    {
                        ls: {value: stackOfCurrentLexicalScope},
                        arity: {value: arity},
                        nuIP: {value: function (index) {
                            return nuIP(this, index);
                        }},
                        nuSegment: {value: segmentTypes.json}
                    });
            }

            function nuIP (segment, index) {
                if (! index) {
                    index = 0;
                }
                var ip = Object.create(
                    {},
                    {
                        segment: {value: segment},
                        index: {value: index, writable: true}
                    });
                return adornIPHelpers(ip);
            }

            function adornIPHelpers (ip) {
                return Object.create(
                    {},
                    {
                        fetch: {value: function () {
                            var op;
                            if (ip.index >= ip.segment.length()) {
                                throw "HALT: EXHAUSTED SEGMENT";
                            } else {
                                op = ip.segment.index(ip.index);
                                ip.index += 1;
                                return op;
                            }
                        }}
                    });
            }

        }());

        (function binarySegment () {
            // TODO
        }());

        segmentTypes.isSegment = function (thing) {
            return thing &&
                'ls' in thing &&
                'arity' in thing;
        };

        return segmentTypes;
    });
}(typeof define === 'function' ? define : function (factory) { module.exports = factory(); }));