(function (define) {
    define(function () {

        'use strict';

        var types = require('../types');
        var nuDict = require('../dict');
        var nuArray = require('../array');

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
                                vcpu.cs.push(dict);
                                return undefined;
                            } else {
                                throw "INVALID OPERAND (DICT_STORE)"; // TODO interrupt handler
                            }
                        } else {
                            throw "NOT ENOUGH OPERANDS (DICT_STORE)"; // TODO interrupt handler
                        }
                    }},
                    DICT_CONTAINS: {value: function () {
                        var dict, key;
                        if (vcpu.cs.length() > 1) {
                            key = vcpu.cs.pop();
                            dict = vcpu.cs.pop();
                            if (nuDict.isDict(dict) && types.isAtomString(key)) {
                                vcpu.cs.push(dict);
                                vcpu.cs.push(dict.has(key));
                                return undefined;
                            } else {
                                throw "INVALID OPERAND (DICT_CONTAINS)"; // TODO interrupt handler
                            }
                        } else {
                            throw "NOT ENOUGH OPERANDS (DICT_CONTAINS)"; // TODO interrupt handler
                        }
                    }},
                    DICT_REMOVE: {value: function () {
                        var dict, key;
                        if (vcpu.cs.length() > 1) {
                            key = vcpu.cs.pop();
                            dict = vcpu.cs.pop();
                            if (nuDict.isDict(dict) && types.isAtomString(key)) {
                                dict.remove(key);
                                vcpu.cs.push(dict);
                                return undefined;
                            } else {
                                throw "INVALID OPERAND (DICT_HAS)"; // TODO interrupt handler
                            }
                        } else {
                            throw "NOT ENOUGH OPERANDS (DICT_HAS)"; // TODO interrupt handler
                        }
                    }},
                    DICT_LOAD: {value: function () {
                        var dict, key;
                        if (vcpu.cs.length() > 1) {
                            key = vcpu.cs.pop();
                            dict = vcpu.cs.pop();
                            if (nuDict.isDict(dict) && types.isAtomString(key)) {
                                vcpu.cs.push(dict);
                                vcpu.cs.push(dict.load(key));
                                return undefined;
                            } else {
                                throw "INVALID OPERAND (DICT_STORE)"; // TODO interrupt handler
                            }
                        } else {
                            throw "NOT ENOUGH OPERANDS (DICT_STORE)"; // TODO interrupt handler
                        }
                    }},
                    DICT_KEYS: {value: function () {
                        var dict, keys;
                        if (vcpu.cs.length() > 0) {
                            dict = vcpu.cs.pop();
                            if (nuDict.isDict(dict)) {
                                vcpu.cs.push(dict);
                                vcpu.cs.push(nuArray(dict.keys()));
                            } else {
                                throw "INVALID OPERAND (DICT_KEYS)"; // TODO interrupt handler
                            }
                        } else {
                                throw "NOT ENOUGH OPERANDS (DICT_KEYS)"; // TODO interrupt handler
                        }
                    }},
                    DICT_CUR_GET: {value: function () {
                        vcpu.cs.push(vcpu.cd);
                        return undefined;
                    }},
                    DICT_CUR_SET: {value: function () {
                        var dict;
                        if (vcpu.cs.length() > 0) {
                            dict = vcpu.cs.pop();
                            if (nuDict.isDict(dict)) {
                                vcpu.cd = dict;
                                vcpu.cs.push(dict);
                                return undefined;
                            } else {
                                throw "INVALID OPERAND (DICT_CUR_SET)"; // TODO interrupt handler
                            }
                        } else {
                            throw "NOT ENOUGH OPERANDS (DICT_CUR_SET)"; // TODO interrupt handler
                        }
                    }}
                });
            return undefined;
        };

    });
}(typeof define === 'function' ? define : function (factory) { module.exports = factory(); }));
