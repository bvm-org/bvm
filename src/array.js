(function (define) {
    define(function () {

        'use strict';

        return function nuArray (array) {
            if (! array) {
                array = [];
            }
            return adornArrayOps(array);
        }

        function adornArrayOps (array) {
            return Object.create(
                {},
                {
                    push: {value: array.push.bind(array)},
                    pop: {value: array.pop.bind(array)},
                    length: {value: function () {
                        return array.length;
                    }},
                    index: {value: function (idx) {
                        if (idx < 0 || array.length <= idx) {
                            throw "ILLEGAL STACK ADDRESS";
                        } else {
                            return array[idx];
                        }
                    }},
                    store: {value: function (idx, val) {
                        if (idx < 0 || array.length <= idx) {
                            throw "ILLEGAL STACK ADDRESS";
                        } else {
                            array[idx] = val;
                            return undefined;
                        }
                    }},
                    clear: {value: function (from) {
                        if (! from) {
                            from = 0;
                        }
                        return array.splice(from, array.length - from);
                    }},
                    lastIndexOf: {value: array.lastIndexOf.bind(array)}
                });
        }

    });
}(typeof define === 'function' ? define : function (factory) { module.exports = factory(); }));
