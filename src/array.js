(function (define) {
    define(function () {

        'use strict';

        var types = require('./types'),
            nuError = require('./errors'),
            id = {},
            undef,
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
                        if (idx < 0 || this.array.length <= idx) {
                            nuError.invalidOperand(this, idx);
                        } else {
                            val = this.array[idx];
                            return val === undef ? types.undef : val;
                        }
                    }},
                    store: {value: function (idx, val) {
                        if (idx < 0) {
                            nuError.invalidOperand(this, idx);
                        } else {
                            this.array[idx] = val;
                            return;
                        }
                    }},
                    clear: {value: function (from, count) {
                        if (typeof from !== 'number') {
                            from = 0;
                        }
                        if (typeof count !== 'number') {
                            count = this.array.length - from;
                        }
                        return this.array.splice(from, count);
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
                        return this.array;
                    }}
                }),
            nuArray;

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
