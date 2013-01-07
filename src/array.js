(function (define) {
    define(function () {

        'use strict';

        var types = require('./types'),
            nuError = require('./errors'),
            id = {},
            undef, nuArray,
            undefFilter = function (ary) {
                var idx = 0, len = ary.length;
                for (; idx < len; idx += 1) {
                    if (ary[idx] === undef) {
                        ary[idx] = types.undef;
                    }
                }
                return ary;
            },
            arrayResetTemplate = {array: {value: undef, configurable: true},
                                  lastIndexOf: {value: undef, configurable: true},
                                  push: {value: undef, configurable: true},
                                  pop: {value: undef, configurable: true}},
            arrayBase = Object.defineProperties(
                {},
                {
                    id: {value: id},
                    length: {value: function (num) {
                        var len = this.array.length;
                        if (typeof num === 'number' && num >= 0) {
                            this.array.length = num;
                        }
                        return len;
                    }},
                    index: {value: function (idx) {
                        var val;
                        if (0 <= idx) {
                            val = this.array[idx];
                            return val === undef ? types.undef : val;
                        } else {
                            nuError.invalidOperand(idx);
                        }
                    }},
                    store: {value: function (idx, val) {
                        if (0 <= idx) {
                            this.array[idx] = val;
                            return;
                        } else {
                            nuError.invalidOperand(idx);
                        }
                    }},
                    clear: {value: function (from, count) {
                        if (typeof from !== 'number') {
                            from = 0;
                        }
                        if (typeof count !== 'number') {
                            count = this.array.length - from;
                        }
                        return undefFilter(this.array.splice(from, count));
                    }},
                    clone: {value: function () {
                        return nuArray(this.array.slice(0));
                    }},
                    resetTo: {value: function (ary) {
                        arrayResetTemplate.array.value = ary;
                        arrayResetTemplate.lastIndexOf.value = ary.lastIndexOf.bind(ary);
                        arrayResetTemplate.push.value = ary.push.bind(ary);
                        arrayResetTemplate.pop.value = ary.pop.bind(ary);
                        Object.defineProperties(this, arrayResetTemplate);
                        return this;
                    }},
                    appendArray: {value: function (ary) {
                        // Irritatingly, because there's a possibility
                        // the underlying array may be shared, we
                        // can't use array.concat because it returns a
                        // new array, which would break the sharing.
                        this.array.push.apply(this.array, ary);
                        return this;
                    }},
                    toJSON: {value: function () {
                        return undefFilter(this.array);
                    }}
                });

        nuArray = function (array) {
            if (! array) {
                array = [];
            }
            return Object.create(arrayBase).resetTo(array);
        };
        nuArray.isArray = function (thing) {
            return thing &&
                typeof thing === 'object' &&
                id === thing.id;
        };
        return nuArray;

    });
}(typeof define === 'function' ? define : function (factory) { module.exports = factory(); }));
