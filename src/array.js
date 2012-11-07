(function (define) {
    define(function () {

        'use strict';

        var types = require('./types'),
            id = {},
            nuArray;

        nuArray = function (array) {
            if (! array) {
                array = [];
            }
            return adornArrayOps(array);
        };
        nuArray.isArray = function (thing) {
            return thing &&
                typeof thing === 'object' &&
                id === thing.id;
        };
        return nuArray;

        function adornArrayOps (array) {
            return Object.create(
                {},
                {
                    id: {value: id},
                    push: {value: array.push.bind(array)},
                    pop: {value: array.pop.bind(array)},
                    length: {value: function (num) {
                        var len = array.length;
                        if (typeof num === 'number' && num >= 0) {
                            array.length = num;
                        }
                        return len
                    }},
                    index: {value: function (idx) {
                        var val;
                        if (idx < 0 || array.length <= idx) {
                            throw "ILLEGAL ARRAY ADDRESS: " + idx;
                        } else {
                            val = array[idx];
                            return val === undefined ? types.undef : val;
                        }
                    }},
                    store: {value: function (idx, val) {
                        if (idx < 0) {
                            throw "ILLEGAL ARRAY ADDRESS";
                        } else {
                            array[idx] = val;
                            return undefined;
                        }
                    }},
                    clear: {value: function (from, count) {
                        if (typeof from !== 'number') {
                            from = 0;
                        }
                        if (typeof count !== 'number') {
                            count = array.length - from;
                        }
                        return array.splice(from, count);
                    }},
                    lastIndexOf: {value: array.lastIndexOf.bind(array)},
                    clone: {value: function () {
                        return nuArray(array.slice(0));
                    }}
                });
        }

    });
}(typeof define === 'function' ? define : function (factory) { module.exports = factory(); }));
