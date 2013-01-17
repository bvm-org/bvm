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
                    op = op.fix(vcpu);
                    found = op.ls.index(op.index);
                } else if (types.isRawString(op)) {
                    found = utils.searchDicts({key: op, dicts: vcpu.ds}).found;
                    found = found === undef ? types.undef : found;
                } else if (nuArray.isArray(op) && op.allChars) {
                    found = utils.searchDicts({key: op.toRawString(), dicts: vcpu.ds}).found;
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
                        } else if (nuArray.isArray(reference) && reference.allChars) {
                            reference = reference.toRawString();
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
                        } else if (nuArray.isArray(reference) && reference.allChars) {
                            vcpu.ds.index(vcpu.ds.length() - 1).store(reference.toRawString(), value);
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
                        if (typeof index === 'number' && index === Math.round(index) &&
                            ((typeof lsl === 'number' && lsl === Math.round(lsl)) ||
                             lsl === types.undef)) {
                            if (lsl === types.undef) {
                                lsl = undef;
                            }
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
