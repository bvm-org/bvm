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
            detectAllChars = function (ary) {
                var len = ary.length, allChars = len > 0, idx = 0;
                for (; allChars && idx < len; idx += 1) {
                    allChars = allChars && types.isChar(ary[idx]);
                }
                return allChars;
            },
            arrayResetTemplate = {array: {value: undef, configurable: true},
                                  lastIndexOf: {value: undef, configurable: true},
                                  push: {value: undef, configurable: true},
                                  pop: {value: undef, configurable: true},
                                  allChars: {value: false, configurable: true, writable: true}},
            arrayBase = Object.defineProperties(
                {},
                {
                    id: {value: id},
                    length: {value: function (num) {
                        var len = this.array.length;
                        if (typeof num === 'number' && num >= 0) {
                            this.array.length = num;
                            this.allChars = detectAllChars(this.array);
                            delete this.string;
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
                        var redetect = false, removed;
                        if (0 <= idx) {
                            removed = this.array[idx];
                            if (this.allChars &&
                                (idx > this.array.length || ! types.isChar(val))) {
                                this.allChars = false;
                            } else if ((! this.allChars) && idx < this.array.length &&
                                        types.isChar(val) && ! types.isChar(removed)) {
                                redetect = true;
                            }
                            this.array[idx] = val;
                            if (redetect) {
                                this.allChars = detectAllChars(this.array);
                            }
                            delete this.string;
                            return;
                        } else {
                            nuError.invalidOperand(idx);
                        }
                    }},
                    clear: {value: function (from, count) {
                        var removed;
                        if (typeof from !== 'number') {
                            from = 0;
                        }
                        if (typeof count !== 'number') {
                            count = this.array.length - from;
                        }
                        removed = this.array.splice(from, count);
                        if (! this.allChars) {
                            this.allChars = detectAllChars(this.array);
                            delete this.string;
                        }
                        return undefFilter(removed);
                    }},
                    clone: {value: function () {
                        return nuArray(this.array.slice(0));
                    }},
                    resetTo: {value: function (ary) {
                        arrayResetTemplate.array.value = ary;
                        arrayResetTemplate.lastIndexOf.value = ary.lastIndexOf.bind(ary);
                        arrayResetTemplate.push.value = ary.push.bind(ary);
                        arrayResetTemplate.pop.value = ary.pop.bind(ary);
                        arrayResetTemplate.allChars.value = detectAllChars(ary);
                        Object.defineProperties(this, arrayResetTemplate);
                        return this;
                    }},
                    appendArray: {value: function (ary) {
                        // Irritatingly, because there's a possibility
                        // the underlying array may be shared, we
                        // can't use array.concat because it returns a
                        // new array, which would break the sharing.
                        var idx, len, array;
                        if (types.isRawString(ary)) {
                            for (len = ary.length, array = [], idx = 0; idx < len; idx += 1) {
                                array.push(types.nuChar(ary.charAt(idx)));
                            }
                            this.array.push.apply(this.array, array);
                        } else {
                            this.array.push.apply(this.array, ary);
                            this.allChars = detectAllChars(this.array);
                        }
                        delete this.string;
                        return this;
                    }},
                    toJSON: {value: function () {
                        if (this.allChars) {
                            return this.toRawString();
                        } else {
                            return undefFilter(this.array);
                        }
                    }},
                    toRawString: {value: function () {
                        if (this.allChars) {
                            if (! types.isRawString(this.string)) {
                                this.string = this.array.reduce(
                                    function (acc, cur) { return acc + cur.ch; }, '');
                            }
                            return this.string;
                        }
                    }}
                });

        nuArray = function (array) {
            var idx, len, ary;
            if (types.isRawString(array)) {
                for (len = array.length, ary = [], idx = 0; idx < len; idx += 1) {
                    ary.push(types.nuChar(array.charAt(idx)));
                }
                array = ary;
            } else {
                if (! array) {
                    array = [];
                }
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
