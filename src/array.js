(function (define) {
    define(function () {

        'use strict';

        var types = require('./types');

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
                    copy: {value: function (idx) {
                        var val;
                        if (idx < 0 || array.length <= idx) {
                            throw "ILLEGAL STACK ADDRESS";
                        } else {
                            val = array[idx];
                            if (typeof val === 'number' ||
                                typeof val === 'string' ||
                                typeof val === 'boolean') {
                                return val;
                            } else {
                                if ('clone' in val && typeof val.clone === 'function') {
                                    return val.clone();
                                } else {
                                    throw "UNABLE TO CLONE VALUE";
                                }
                            }
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
                    lastIndexOf: {value: array.lastIndexOf.bind(array)},
                    clone: {value: function () {
                        return nuArray(array.slice(0));
                    }},
                    asPointer: {value: function () {
                        return types.nuPointer(this);
                    }}
                });
        }

    });
}(typeof define === 'function' ? define : function (factory) { module.exports = factory(); }));
