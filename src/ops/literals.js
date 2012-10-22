(function (define) {
    define(function () {

        'use strict';

        var types = require('../types');
        var nuArray = require('../array');

        return function (vcpu, ops) {
            Object.defineProperties(
                ops,
                {
                    ARRAY_START: {value: function () {
                        this.MARK();
                        return undefined;
                    }},
                    ARRAY_END: {value: function () {
                        var len = vcpu.cs.length(), mark = vcpu.cs.lastIndexOf(types.mark),
                            removed;
                        if (mark === -1) {
                            throw "INVALID OPERAND (ARRAY_END)"; // TODO interrupt handler
                        } else {
                            removed = vcpu.cs.clear(mark);
                            removed.shift(); // drop the initial mark
                            vcpu.cs.push(nuArray(removed));
                            return undefined;
                        }
                    }},

                    DICT_START: {value: function () {
                        this.MARK();
                        return undefined;
                    }},
                    DICT_END: {value: function () {
                        var len = vcpu.cs.length(), mark = vcpu.cs.lastIndexOf(types.mark),
                            dict = {}, removed, idx, key, val;
                        if (mark === -1) {
                            throw "INVALID OPERAND (DICT_END)"; // TODO interrupt handler
                        } else {
                            removed = vcpu.cs.clear(mark);
                            removed.shift(); // drop the initial mark
                            if (removed.length % 2 !== 0) {
                                throw "INVALID OPERAND (DICT_END)"; // TODO interrupt handler
                            } else {
                                for (idx = 0; idx < removed.length; idx += 2) {
                                    key = removed[idx];
                                    val = removed[idx + 1];
                                    dict[key] = val;
                                }
                                vcpu.cs.push(nuDict(dict));
                                return undefined;
                            }
                        }
                    }},

                    SEG_START: {value: function () {
                        this.MARK();
                        return undefined;
                    }},
                    SEG_END: {value: function () {
                        var len = vcpu.cs.length(), mark = vcpu.cs.lastIndexOf(types.mark),
                            removed, arity;
                        if (mark === -1) {
                            throw "INVALID OPERAND (SEG_END)"; // TODO interrupt handler
                        } else {
                            removed = vcpu.cs.clear(mark);
                            removed.shift(); // drop the initial mark
                            arity = removed.shift();
                            vcpu.cs.push(vcpu.cs.nuSegment(removed, arity, vcpu.cs));
                            return undefined;
                        }
                    }}
                });
            return undefined;
        };

    });
}(typeof define === 'function' ? define : function (factory) { module.exports = factory(); }));
