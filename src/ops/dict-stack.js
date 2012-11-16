(function (define) {
    define(function () {

        'use strict';

        var types = require('../types'),
            nuDict = require('../dict'),
            nuArray = require('../array'),
            nuError = require('../errors'),
            undef;

        return function (vcpu) {
            return {
                DICT_STACK_PUSH: function () {
                    var dict;
                    if (vcpu.cs.length() > 0) {
                        dict = vcpu.cs.pop();
                        if (nuDict.isDict(dict)) {
                            vcpu.ds.push(dict);
                            return;
                        } else {
                            nuError.invalidOperand(dict);
                        }
                    } else {
                        nuError.notEnoughOperands();
                    }
                },
                DICT_STACK_POP: function () {
                    if (vcpu.ds.length() > 0) {
                        vcpu.cs.push(vcpu.ds.pop());
                    } else {
                        vcpu.cs.push(types.undef);
                    }
                    return;
                },
                DICT_STACK_WHERE: function () {
                    var key, dict;
                    if (vcpu.cs.length() > 0) {
                        key = vcpu.cs.pop();
                        if (types.isString(key)) {
                            dict = utils.searchDicts({key: key, dicts: vcpu.ds}).dict;
                            vcpu.cs.push(dict === undef ? types.undef : dict);
                            return;
                        } else {
                            nuError.invalidOperand(key);
                        }
                    } else {
                        nuError.notEnoughOperands();
                    }
                },
                DICT_STACK_REPLACE: function () {
                    var dict, key, value;
                    if (vcpu.cs.length() > 1) {
                        value = vcpu.cs.pop();
                        key = vcpu.cs.pop();
                        if (types.isString(key)) {
                            dict = utils.searchDicts({key: key, dicts: vcpu.ds}).dict;
                            if (nuDict.isDict(dict)) {
                                dict.store(key, value);
                            } else if (vcpu.ds.length() !== 0) {
                                vcpu.ds.index(vcpu.ds.length() - 1).store(key, value);
                            } else {
                                nuError.notEnoughOperands();
                            }
                            return;
                        } else {
                            nuError.invalidOperand(key);
                        }
                    } else {
                        nuError.notEnoughOperands();
                    }
                },
                DICT_STACK_LOAD: function () {
                    vcpu.cs.push(vcpu.ds);
                },
                DICT_STACK_SET: function () {
                    var dicts, ok, idx;
                    if (vcpu.cs.length() > 0) {
                        dicts = vcpu.cs.pop();
                        if (nuArray.isArray(dicts)) {
                            ok = true;
                            for (idx = dicts.length() - 1; ok && idx >= 0 ; idx -= 1) {
                                ok = ok && (nuDict.isDict(dicts.index(idx)));
                            }
                            if (ok) {
                                vcpu.ds = dicts;
                            } else {
                                nuError.invalidOperand(dicts);
                            }
                        } else {
                            nuError.invalidOperand(dicts);
                        }
                    } else {
                        nuError.notEnoughOperands();
                    }
                }
            };
        };

    });
}(typeof define === 'function' ? define : function (factory) { module.exports = factory(); }));
