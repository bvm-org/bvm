(function (define) {
    define(function () {

        'use strict';

        var types = require('../types'),
            nuDict = require('../dict'),
            nuArray = require('../array'),
            nuError = require('../errors'),
            nuOpcode = require('../opcode');

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
                DICT_EXPAND: nuOpcode(vcpu, [nuDict.isDict], function (dict) {
                    dict.keys().forEach(function (key) {
                        vcpu.cs.push(nuArray(key));
                        vcpu.cs.push(dict.load(key));
                    });
                }),
                DICT_STORE: nuOpcode(
                    vcpu, [nuDict.isDict, nuOpcode.tests.isString, nuOpcode.tests.any],
                    function (dict, key, value) {
                        dict.store(key.toRawString(), value);
                        vcpu.cs.push(dict);
                        return;
                    }),
                DICT_CONTAINS: nuOpcode(
                    vcpu, [nuDict.isDict, nuOpcode.tests.isString],
                    function (dict, key) {
                        vcpu.cs.push(dict);
                        vcpu.cs.push(dict.has(key.toRawString()));
                        return;
                    }),
                DICT_REMOVE: nuOpcode(
                    vcpu, [nuDict.isDict, nuOpcode.tests.isString],
                    function (dict, key) {
                        dict.remove(key.toRawString());
                        vcpu.cs.push(dict);
                        return;
                    }),
                DICT_LOAD: nuOpcode(
                    vcpu, [nuDict.isDict, nuOpcode.tests.isString],
                    function (dict, key) {
                        vcpu.cs.push(dict);
                        vcpu.cs.push(dict.load(key.toRawString()));
                        return;
                    }),
                DICT_KEYS: nuOpcode(vcpu, [nuDict.isDict], function (dict) {
                    vcpu.cs.push(dict);
                    vcpu.cs.push(nuArray(dict.keys().map(
                        function (str) { return nuArray(str); })));
                    return;
                })
            };
        };

    });
}(typeof define === 'function' ? define : function (factory) { module.exports = factory(); }));
