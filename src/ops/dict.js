(function (define) {
    define(function () {

        'use strict';

        var types = require('../types');
        var nuDict = require('../dict');

        return function (vcpu, ops) {
            Object.defineProperties(
                ops,
                {
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
                    DICT_NEW: {value: function () {
                        vcpu.cs.push(nuDict());
                        return undefined;
                    }},
                    DICT_STORE: {value: function () {
                        var dict, key, value;
                        if (vcpu.cs.length() > 2) {
                            value = vcpu.cs.pop();
                            key = vcpu.cs.pop();
                            dict = vcpu.cs.pop();
                            if (nuDict.isDict(dict) && types.isAtomString(key)) {
                                dict.store(key, value);
                                return undefined;
                            } else {
                                throw "INVALID OPERAND (DICT_STORE)"; // TODO interrupt handler
                            }
                        } else {
                            throw "NOT ENOUGH OPERANDS (DICT_STORE)"; // TODO interrupt handler
                        }
                    }},
                    DICT_LOAD: {value: function () {
                        var dict, key;
                        if (vcpu.cs.length() > 1) {
                            key = vcpu.cs.pop();
                            dict = vcpu.cs.pop();
                            if (nuDict.isDict(dict) && types.isAtomString(key)) {
                                if (dict.has(key)) {
                                    vcpu.cs.push(dict.load(key));
                                } else {
                                    vcpu.cs.push(types.undef);
                                }
                                return undefined;
                            } else {
                                throw "INVALID OPERAND (DICT_STORE)"; // TODO interrupt handler
                            }
                        } else {
                            throw "NOT ENOUGH OPERANDS (DICT_STORE)"; // TODO interrupt handler
                        }
                    }}
                });
            return undefined;
        };

    });
}(typeof define === 'function' ? define : function (factory) { module.exports = factory(); }));
