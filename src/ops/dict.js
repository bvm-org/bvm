(function (define) {
    define(function () {

        'use strict';

        var types = require('../types');
        var nuDict = require('../dict');
        var nuArray = require('../array');

        return function (vcpu) {
            return {
                DICT_START: function () {
                    this.MARK();
                    return undefined;
                },
                DICT_END: function () {
                    var len = vcpu.cs.length(), mark = vcpu.cs.lastIndexOf(types.mark),
                    dict = {}, removed, idx, key, val;
                    if (mark === -1) {
                        throw "INVALID OPERAND (DICT_END)"; // TODO interrupt handler
                    } else {
                        removed = vcpu.cs.clear(mark);
                        removed.shift(); // drop the initial mark
                        if (removed.length % 2 === 0) {
                            for (idx = 0, len = removed.length; idx < len; idx += 2) {
                                key = removed[idx];
                                val = removed[idx + 1];
                                dict[key] = val;
                            }
                            vcpu.cs.push(nuDict(dict));
                            return undefined;
                        } else {
                            throw "INVALID OPERAND (DICT_END)"; // TODO interrupt handler
                        }
                    }
                },
                DICT_NEW: function () {
                    vcpu.cs.push(nuDict());
                    return undefined;
                },
                DICT_STORE: function () {
                    var dict, key, value;
                    if (vcpu.cs.length() > 2) {
                        value = vcpu.cs.pop();
                        key = vcpu.cs.pop();
                        dict = vcpu.cs.pop();
                        if (nuDict.isDict(dict) && typeof key === 'string') {
                            dict.store(key, value);
                            vcpu.cs.push(dict);
                            return undefined;
                        } else {
                            throw "INVALID OPERAND (DICT_STORE)"; // TODO interrupt handler
                        }
                    } else {
                        throw "NOT ENOUGH OPERANDS (DICT_STORE)"; // TODO interrupt handler
                    }
                },
                DICT_CONTAINS: function () {
                    var dict, key;
                    if (vcpu.cs.length() > 1) {
                        key = vcpu.cs.pop();
                        dict = vcpu.cs.pop();
                        if (nuDict.isDict(dict) && typeof key === 'string') {
                            vcpu.cs.push(dict);
                            vcpu.cs.push(dict.has(key));
                            return undefined;
                        } else {
                            throw "INVALID OPERAND (DICT_CONTAINS)"; // TODO interrupt handler
                        }
                    } else {
                        throw "NOT ENOUGH OPERANDS (DICT_CONTAINS)"; // TODO interrupt handler
                    }
                },
                DICT_REMOVE: function () {
                    var dict, key;
                    if (vcpu.cs.length() > 1) {
                        key = vcpu.cs.pop();
                        dict = vcpu.cs.pop();
                        if (nuDict.isDict(dict) && typeof key === 'string') {
                            dict.remove(key);
                            vcpu.cs.push(dict);
                            return undefined;
                        } else {
                            throw "INVALID OPERAND (DICT_HAS)"; // TODO interrupt handler
                        }
                    } else {
                        throw "NOT ENOUGH OPERANDS (DICT_HAS)"; // TODO interrupt handler
                    }
                },
                DICT_LOAD: function () {
                    var dict, key;
                    if (vcpu.cs.length() > 1) {
                        key = vcpu.cs.pop();
                        dict = vcpu.cs.pop();
                        if (nuDict.isDict(dict) && typeof key === 'string') {
                            vcpu.cs.push(dict);
                            vcpu.cs.push(dict.load(key));
                            return undefined;
                        } else {
                            throw "INVALID OPERAND (DICT_STORE)"; // TODO interrupt handler
                        }
                    } else {
                        throw "NOT ENOUGH OPERANDS (DICT_STORE)"; // TODO interrupt handler
                    }
                },
                DICT_KEYS: function () {
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
                }
            };
        };

    });
}(typeof define === 'function' ? define : function (factory) { module.exports = factory(); }));
