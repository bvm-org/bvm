(function (define) {
    define(function () {

        'use strict';

        var segmentTypes = require('../segment'),
            types = require('../types'),
            nuArray = require('../array'),
            nuDict = require('../dict'),
            nuStack = require('../stack'),
            utils = require('../utils');

        return function (vcpu) {
            return {
                LOAD: function () {
                    var reference, found;
                    if (vcpu.cs.length() > 0) {
                        reference = vcpu.cs.pop();
                        if (types.isLexicalAddress(reference)) {
                            vcpu.cs.push(vcpu.dereferenceScope(reference.lsl).index(reference.index));
                            return undefined;
                        } else if (typeof reference === 'string') {
                            found = vcpu.cd.load(reference);
                            if (found === types.undef &&
                                reference in this) {
                                vcpu.cs.push(this[reference]);
                                return undefined;
                            } else {
                                vcpu.cs.push(found);
                                return undefined;
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
                            return undefined;
                        } else if (typeof reference === 'string') {
                            vcpu.cd.store(reference, value);
                            return undefined;
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
                            return undefined;
                        } else {
                            throw "INVALID OPERAND (LEXICAL_ADDRESS)"; // TODO interrupt handler
                        }
                    } else {
                        throw "NOT ENOUGH OPERANDS (LEXICAL_ADDRESS)"; // TODO interrupt handler
                    }
                },
                UNKNOWN: function (op) {
                    var thing;
                    if (types.isLexicalAddress(op)) {
                        thing = vcpu.dereferenceScope(op.lsl).index(op.index);
                    } else if (typeof op === 'string') {
                        thing = vcpu.cd.load(op);
                    } else {
                        vcpu.cs.push(op);
                        return undefined;
                    }
                    vcpu.cs.push(thing);
                    if (utils.isExecutable(thing)) {
                        return this.EXEC();
                    }
                    return undefined;
                }
            };
        };

    });
}(typeof define === 'function' ? define : function (factory) { module.exports = factory(); }));
