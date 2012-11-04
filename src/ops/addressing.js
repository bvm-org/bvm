(function (define) {
    define(function () {

        'use strict';

        var segmentTypes = require('../segment'),
            types = require('../types'),
            nuArray = require('../array'),
            nuDict = require('../dict');

        return function (vcpu, ops) {
            Object.defineProperties(
                ops,
                {
                    LOAD: {value: function () {
                        var reference;
                        if (vcpu.cs.length() > 0) {
                            reference = vcpu.cs.pop();
                            if (types.isLexicalAddress(reference)) {
                                vcpu.cs.push(vcpu.dereferenceScope(reference.lsl).index(reference.index));
                                return undefined;
                            } else if (typeof reference === 'string') {
                                vcpu.cs.push(vcpu.cd.load(reference));
                                return undefined;
                            } else {
                                throw "INVALID OPERAND (LOAD)"; // TODO interrupt handler
                            }
                        } else {
                            throw "NOT ENOUGH OPERANDS (LOAD)"; // TODO interrupt handler
                        }
                    }},
                    STORE: {value: function () {
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
                    }},
                    LEXICAL_ADDRESS: {value: function () {
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
                    }},
                    UNKNOWN: {value: function (op) {
                        if (types.isLexicalAddress(op)) {
                            vcpu.cs.push(vcpu.dereferenceScope(op.lsl).index(op.index));
                            return undefined;
                        } else if (typeof op === 'string') {
                            vcpu.cs.push(vcpu.cd.load(op));
                            return undefined;
                        } else {
                            vcpu.cs.push(op);
                            return undefined;
                        }
                    }}
                });
            return undefined;
        };

    });
}(typeof define === 'function' ? define : function (factory) { module.exports = factory(); }));
