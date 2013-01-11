(function (define) {
    define(function () {

        'use strict';

        var types = require('../types'),
            nuDict = require('../dict'),
            nuArray = require('../array'),
            nuError = require('../errors');

        return function (vcpu) {
            return {
                DICT_START: function () {
                    this.MARK();
                    return;
                },
                DICT_END: function () {
                    var len = vcpu.cs.length(), mark = vcpu.cs.lastIndexOf(types.mark),
                    dict = {}, removed, idx, key, val;
                    if (mark === -1) {
                        nuError.notEnoughOperands();
                    } else {
                        removed = vcpu.cs.clear(mark);
                        removed.shift(); // drop the initial mark
                        if (removed.length % 2 === 0) {
                            for (idx = 0, len = removed.length; idx < len; idx += 2) {
                                key = removed[idx];
                                val = removed[idx + 1];
                                if (nuArray.isArray(key) && key.allChars) {
                                    dict[key.toRawString()] = val;
                                } else {
                                    nuError.invalidOperand(key);
                                }
                            }
                            vcpu.cs.push(nuDict(dict));
                            return;
                        } else {
                            nuError.invalidOperand(nuArray(removed));
                        }
                    }
                },
                DICT_NEW: function () {
                    vcpu.cs.push(nuDict());
                    return;
                },
                DICT_EXPAND: function () {
                    var dict;
                    if (vcpu.cs.length() > 0) {
                        dict = vcpu.cs.pop();
                        if (nuDict.isDict(dict)) {
                            dict.keys().forEach(function (key) {
                                vcpu.cs.push(nuArray(key));
                                vcpu.cs.push(dict.load(key));
                            });
                            return;
                        } else {
                            nuError.invalidOperand(dict);
                        }
                    } else {
                        nuError.notEnoughOperands();
                    }
                },
                DICT_STORE: function () {
                    var dict, key, value;
                    if (vcpu.cs.length() > 2) {
                        value = vcpu.cs.pop();
                        key = vcpu.cs.pop();
                        dict = vcpu.cs.pop();
                        if (nuDict.isDict(dict) && nuArray.isArray(key) && key.allChars) {
                            dict.store(key.toRawString(), value);
                            vcpu.cs.push(dict);
                            return;
                        } else {
                            nuError.invalidOperand(dict, key);
                        }
                    } else {
                        nuError.notEnoughOperands();
                    }
                },
                DICT_CONTAINS: function () {
                    var dict, key;
                    if (vcpu.cs.length() > 1) {
                        key = vcpu.cs.pop();
                        dict = vcpu.cs.pop();
                        if (nuDict.isDict(dict) && nuArray.isArray(key) && key.allChars) {
                            vcpu.cs.push(dict);
                            vcpu.cs.push(dict.has(key.toRawString()));
                            return;
                        } else {
                            nuError.invalidOperand(dict, key);
                        }
                    } else {
                        nuError.notEnoughOperands();
                    }
                },
                DICT_REMOVE: function () {
                    var dict, key;
                    if (vcpu.cs.length() > 1) {
                        key = vcpu.cs.pop();
                        dict = vcpu.cs.pop();
                        if (nuDict.isDict(dict) && nuArray.isArray(key) && key.allChars) {
                            dict.remove(key.toRawString());
                            vcpu.cs.push(dict);
                            return;
                        } else {
                            nuError.invalidOperand(dict, key);
                        }
                    } else {
                        nuError.notEnoughOperands();
                    }
                },
                DICT_LOAD: function () {
                    var dict, key;
                    if (vcpu.cs.length() > 1) {
                        key = vcpu.cs.pop();
                        dict = vcpu.cs.pop();
                        if (nuDict.isDict(dict) && nuArray.isArray(key) && key.allChars) {
                            vcpu.cs.push(dict);
                            vcpu.cs.push(dict.load(key.toRawString()));
                            return;
                        } else {
                            nuError.invalidOperand(dict, key);
                        }
                    } else {
                        nuError.notEnoughOperands();
                    }
                },
                DICT_KEYS: function () {
                    var dict, keys;
                    if (vcpu.cs.length() > 0) {
                        dict = vcpu.cs.pop();
                        if (nuDict.isDict(dict)) {
                            vcpu.cs.push(dict);
                            vcpu.cs.push(nuArray(dict.keys().map(
                                function (str) { return nuArray(str); })));
                        } else {
                            nuError.invalidOperand(dict);
                        }
                    } else {
                        nuError.notEnoughOperands();
                    }
                }
            };
        };

    });
}(typeof define === 'function' ? define : function (factory) { module.exports = factory(); }));
