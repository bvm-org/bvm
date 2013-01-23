(function (define) {
    define(function () {

        'use strict';

        var types = require('../types'),
            nuDict = require('../dict'),
            nuArray = require('../array'),
            nuError = require('../errors'),
            utils = require('../utils'),
            nuOpcode = require('../opcode'),
            undef;

        return function (vcpu) {
            return {
                DICT_STACK_PUSH: nuOpcode(vcpu, [nuDict.isDict], function (dict) {
                    vcpu.ds.push(dict);
                    return;
                }),
                DICT_STACK_POP: function () {
                    if (vcpu.ds.length() > 0) {
                        vcpu.cs.push(vcpu.ds.pop());
                    } else {
                        vcpu.cs.push(types.undef);
                    }
                    return;
                },
                DICT_STACK_WHERE: nuOpcode(vcpu, [nuOpcode.tests.isString], function (key) {
                    var dict = utils.searchDicts({key: key.toRawString(), dicts: vcpu.ds}).dict;
                    vcpu.cs.push(dict === undef ? types.undef : dict);
                    return;
                }),
                DICT_STACK_REPLACE: nuOpcode(
                    vcpu, [nuOpcode.tests.isString, nuOpcode.tests.any],
                    function (key, value) {
                        var dict;
                        key = key.toRawString();
                        dict = utils.searchDicts({key: key, dicts: vcpu.ds}).dict;
                        if (nuDict.isDict(dict)) {
                            dict.store(key, value);
                        } else if (vcpu.ds.length() !== 0) {
                            vcpu.ds.index(vcpu.ds.length() - 1).store(key, value);
                        } else {
                            nuError.notEnoughOperands();
                        }
                        return;
                    }),
                DICT_STACK_LOAD: function () {
                    vcpu.cs.push(vcpu.ds);
                },
                DICT_STACK_SET: nuOpcode(
                    vcpu,
                    [function (dicts) {
                        var ok, idx;
                        for (idx = dicts.length() - 1, ok = true; ok && idx >= 0 ; idx -= 1) {
                            ok = ok && (nuDict.isDict(dicts.index(idx)));
                        }
                        return ok;
                    }],
                    function (dicts) {
                        vcpu.ds = dicts;
                        return;
                    })
            };
        };

    });
}(typeof define === 'function' ? define : function (factory) { module.exports = factory(); }));
