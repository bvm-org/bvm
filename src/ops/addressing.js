(function (define) {
    define(function () {

        'use strict';

        var types = require('../types'),
            nuArray = require('../array'),
            nuDict = require('../dict'),
            nuStack = require('../stack'),
            utils = require('../utils'),
            nuError = require('../errors'),
            undef;

        return function (vcpu) {
            vcpu.setDefaultOp(function (op) {
                var found;
                if (types.isLexicalAddress(op)) {
                    found = op.fix(vcpu).ls.index(op.index);
                } else if (types.isString(op)) {
                    found = utils.searchDicts({key: op, dicts: vcpu.ds}).found;
                    found = found === undef ? types.undef : found;
                } else {
                    vcpu.cs.push(op);
                    return;
                }
                vcpu.cs.push(found);
                if (utils.isExecutable(found)) {
                    this.EXEC();
                }
            });
            return {
                LOAD: function () {
                    var reference, found;
                    if (vcpu.cs.length() > 0) {
                        reference = vcpu.cs.pop();
                        if (types.isLexicalAddress(reference)) {
                            vcpu.cs.push(reference.ls.index(reference.index));
                            return;
                        } else if (types.isString(reference)) {
                            if (reference in this) {
                                vcpu.cs.push(this[reference]);
                                return;
                            } else {
                                found = utils.searchDicts({key: reference, dicts: vcpu.ds}).found;
                                if (found === undef) {
                                    vcpu.cs.push(types.undef);
                                    return;
                                } else {
                                    vcpu.cs.push(found);
                                }
                            }
                        } else {
                            nuError.invalidOperand(reference);
                        }
                    } else {
                        nuError.notEnoughOperands();
                    }
                },
                STORE: function () {
                    var value, reference;
                    if (vcpu.cs.length() > 1) {
                        value = vcpu.cs.pop();
                        reference = vcpu.cs.pop();
                        if (types.isLexicalAddress(reference)) {
                            reference.ls.store(reference.index, value);
                            return;
                        } else if (types.isString(reference)) {
                            vcpu.ds.index(vcpu.ds.length() - 1).store(reference, value);
                            return;
                        } else {
                            nuError.invalidOperand(reference);
                        }
                    } else {
                        nuError.notEnoughOperands();
                    }
                },
                LEXICAL_ADDRESS: function () {
                    var lsl, index;
                    if (vcpu.cs.length() > 1) {
                        index = vcpu.cs.pop();
                        lsl = vcpu.cs.pop();
                        if (typeof index === 'number' && index >= 0 &&
                            typeof lsl === 'number' && lsl >= 0) {
                            vcpu.cs.push(types.nuLexicalAddress(lsl, index).fix(vcpu));
                            return;
                        } else {
                            nuError.invalidOperand(lsl, index);
                        }
                    } else {
                        nuError.notEnoughOperands();
                    }
                }
            };
        };

    });
}(typeof define === 'function' ? define : function (factory) { module.exports = factory(); }));
