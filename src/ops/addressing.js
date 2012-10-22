(function (define) {
    define(function () {

        'use strict';

        var segmentTypes = require('../segment');

        return function (vcpu, ops) {
            Object.defineProperties(
                ops,
                {
                    LOAD: {value: function () {
                        var reference;
                        if (vcpu.cs.length() > 0) {
                            reference = vcpu.cs.pop();
                            if (isAddressCouplet(reference)) {
                                vcpu.cs.push(vcpu.dereferenceScope(reference.lsl).index(reference.index));
                                return undefined;
                            } else if (isAtomString(reference)) {
                                if (vcpu.cd.has(reference)) {
                                    vcpu.cs.push(vcpu.cd.load(reference));
                                } else {
                                    vcpu.cs.push(types.undef);
                                }
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
                            if (isAddressCouplet(reference)) {
                                vcpu.dereferenceScope(reference.lsl).store(reference.index, value);
                                return undefined;
                            } else if (isAtomString(reference)) {
                                vcpu.cd.store(reference, value);
                                return undefined;
                            } else {
                                throw "INVALID OPERAND (STORE)"; // TODO interrupt handler
                            }
                        } else {
                            throw "NOT ENOUGH OPERANDS (STORE)"; // TODO interrupt handler
                        }
                    }},
                    ADDRESS: {value: function () { // TODO not entirely sure if this is needed.
                        vcpu.cs.push({lsl: vcpu.cs.lsl, index: vcpu.cs.length()})
                        return undefined;
                    }},
                    UNKNOWN: {value: function (op) {
                        var thing;
                        if (isAddressCouplet(op)) {
                            thing = vcpu.dereferenceScope(op.lsl);
                        } else if (isAtomString(op)) {
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

        function isAddressCouplet (thing) {
            return thing &&
                typeof thing === 'object' &&
                'lsl' in thing &&
                'index' in thing;
        }

        function isAtomString (thing) {
            return thing &&
                typeof thing === 'string';
        }

    });
}(typeof define === 'function' ? define : function (factory) { module.exports = factory(); }));
