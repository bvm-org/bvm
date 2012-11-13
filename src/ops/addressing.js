(function (define) {
    define(function () {

        'use strict';

        var segmentTypes = require('../segment'),
            types = require('../types'),
            nuArray = require('../array'),
            nuDict = require('../dict'),
            nuStack = require('../stack'),
            utils = require('../utils'),
            undef;

        return function (vcpu) {
            return {
                LOAD: function () {
                    var reference, found;
                    if (vcpu.cs.length() > 0) {
                        reference = vcpu.cs.pop();
                        if (types.isLexicalAddress(reference)) {
                            vcpu.cs.push(vcpu.dereferenceScope(reference.lsl).index(reference.index));
                            return;
                        } else if (types.isString(reference)) {
                            found = utils.searchDicts({key: reference, dicts: vcpu.ds}).found;
                            if (found === undef && reference in this) {
                                vcpu.cs.push(this[reference]);
                                return;
                            } else {
                                vcpu.cs.push(found);
                                return;
                            }
                        } else {
                            throw "INVALID OPERAND (LOAD)" + typeof reference; // TODO interrupt handler
                        }
                    } else {
                        throw "NOT ENOUGH OPERANDS (LOAD)"; // TODO interrupt handler
                    }
                },
                STORE: function () {
                    var value, reference;
                    if (vcpu.cs.length() > 1) {
                        value = vcpu.cs.pop();
                        reference = vcpu.cs.pop();
                        if (types.isLexicalAddress(reference)) {
                            vcpu.dereferenceScope(reference.lsl).store(reference.index, value);
                            return;
                        } else if (types.isString(reference)) {
                            vcpu.ds.index(vcpu.ds.length() - 1).store(reference, value);
                            return;
                        } else {
                            throw "INVALID OPERAND (STORE)"; // TODO interrupt handler
                        }
                    } else {
                        throw "NOT ENOUGH OPERANDS (STORE)"; // TODO interrupt handler
                    }
                },
                LEXICAL_ADDRESS: function () {
                    var lsl, index;
                    if (vcpu.cs.length() > 1) {
                        index = vcpu.cs.pop();
                        lsl = vcpu.cs.pop();
                        if (typeof index === 'number' &&
                            typeof lsl === 'number') {
                            vcpu.cs.push(types.nuLexicalAddress(lsl, index));
                            return;
                        } else {
                            throw "INVALID OPERAND (LEXICAL_ADDRESS)"; // TODO interrupt handler
                        }
                    } else {
                        throw "NOT ENOUGH OPERANDS (LEXICAL_ADDRESS)"; // TODO interrupt handler
                    }
                },
                UNKNOWN: function (op) {
                    if (types.isLexicalAddress(op)) {
                        vcpu.cs.push(vcpu.dereferenceScope(op.lsl).index(op.index));
                        return;
                    } else if (types.isString(op)) {
                        vcpu.cs.push(utils.searchDicts({key: op, dicts: vcpu.ds}).found);
                        return;
                    } else {
                        vcpu.cs.push(op);
                        return;
                    }
                }
            };
        };

    });
}(typeof define === 'function' ? define : function (factory) { module.exports = factory(); }));
