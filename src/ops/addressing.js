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
                            if (types.isAddressCouplet(reference)) {
                                vcpu.cs.push(vcpu.dereferenceScope(reference.lsl).index(reference.index));
                                return undefined;
                            } else if (types.isAtomString(reference)) {
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
                            if (types.isAddressCouplet(reference)) {
                                vcpu.dereferenceScope(reference.lsl).store(reference.index, value);
                                return undefined;
                            } else if (types.isAtomString(reference)) {
                                vcpu.cd.store(reference, value);
                                return undefined;
                            } else {
                                throw "INVALID OPERAND (STORE)"; // TODO interrupt handler
                            }
                        } else {
                            throw "NOT ENOUGH OPERANDS (STORE)"; // TODO interrupt handler
                        }
                    }},
                    STACK_COUPLET: {value: function () {
                        var lsl, index;
                        if (vcpu.cs.length() > 1) {
                            index = vcpu.cs.pop();
                            lsl = vcpu.cs.pop();
                            if (typeof index === 'number' &&
                                typeof lsl === 'number') {
                                vcpu.cs.push(types.nuAddressCouplet(lsl, index));
                            } else {
                                throw "INVALID OPERAND (STACK_COUPLET)"; // TODO interrupt handler
                            }
                        } else {
                            throw "NOT ENOUGH OPERANDS (STACK_COUPLET)"; // TODO interrupt handler
                        }
                        return undefined;
                    }},
                    UNKNOWN: {value: function (op) {
                        var thing;
                        if (types.isAddressCouplet(op)) {
                            thing = vcpu.dereferenceScope(op.lsl).index(op.index);
                        } else if (types.isAtomString(op)) {
                            thing = vcpu.cd.load(op);
                        } else {
                            vcpu.cs.push(op);
                            return undefined;
                        }
                        vcpu.cs.push(thing);
                        if (segmentTypes.isSegment(thing)) {
                            this.EXEC();
                        }
                        return undefined;
                    }}
                });
            return undefined;
        };

    });
}(typeof define === 'function' ? define : function (factory) { module.exports = factory(); }));
