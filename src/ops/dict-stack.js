(function (define) {
    define(function () {

        'use strict';

        var types = require('../types');
        var nuDict = require('../dict');
        var nuArray = require('../array');

        return function (vcpu) {
            return {
                DICT_STACK_PUSH: function () {
                    var dict;
                    if (vcpu.cs.length() > 0) {
                        dict = vcpu.cs.pop();
                        if (nuDict.isDict(dict)) {
                            vcpu.ds.push(dict);
                            return undefined;
                        } else {
                            throw "INVALID OPERAND (DICT_STACK_PUSH)"; // TODO interrupt handler
                        }
                    } else {
                        throw "NOT ENOUGH OPERANDS (DICT_STACK_PUSH)"; // TODO interrupt handler
                    }
                },
                DICT_STACK_POP: function () {
                    if (vcpu.ds.length() > 0) {
                        vcpu.cs.push(vcpu.ds.pop());
                    } else {
                        vcpu.cs.push(types.undef);
                    }
                },
                DICT_STACK_WHERE: function () {
                    var key, dict;
                    if (vcpu.cs.length() > 0) {
                        key = vcpu.cs.pop();
                        if (typeof key === 'string') {
                            dict = utils.searchDicts({key: key, dicts: vcpu.ds}).dict;
                            if (nuDict.isDict(dict)) {
                                vcpu.cs.push(dict)
                            } else {
                                vcpu.cs.push(types.undef);
                            }
                            return undefined;
                        } else {
                            throw "INVALID OPERAND (DICT_STACK_WHERE)"; // TODO interrupt handler
                        }
                    } else {
                        throw "NOT ENOUGH OPERANDS (DICT_STACK_WHERE)"; // TODO interrupt handler
                    }
                },
                DICT_STACK_REPLACE: function () {
                    var dict, key, value;
                    if (vcpu.cs.length() > 1) {
                        value = vcpu.cs.pop();
                        key = vcpu.cs.pop();
                        if (typeof key === 'string') {
                            dict = utils.searchDicts({key: key, dicts: vcpu.ds}).dict;
                            if (nuDict.isDict(dict)) {
                                dict.store(key, value);
                            } else {
                                vcpu.ds.index(vcpu.ds.length() - 1).store(key, value);
                            }
                            return undefined;
                        } else {
                            throw "INVALID OPERAND (DICT_STACK_REPLACE)"; // TODO interrupt handler
                        }
                    } else {
                        throw "NOT ENOUGH OPERANDS (DICT_STACK_REPLACE)"; // TODO interrupt handler
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
                                throw "INVALID OPERAND (DICT_STACK_SET)"; // TODO interrupt handler
                            }
                        } else {
                            throw "INVALID OPERAND (DICT_STACK_SET)"; // TODO interrupt handler
                        }
                    } else {
                        throw "NOT ENOUGH OPERANDS (DICT_STACK_SET)"; // TODO interrupt handler
                    }
                }
            };
        };

    });
}(typeof define === 'function' ? define : function (factory) { module.exports = factory(); }));
