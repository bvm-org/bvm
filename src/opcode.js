(function (define) {
    define(function () {

        'use strict';

        var undef,
            nuError = require('./errors'),
            nuArray = require('./array'),
            nuSegment = require('./segment'),
            nuStack = require('./stack'),
            types = require('./types'),
            opcodeBase = Object.defineProperties(
                {},
                {
                    invoke: {value: function (ops) {
                        var vcpu = this.vcpu,
                            len = vcpu.cs.length(),
                            arity = this.arity,
                            removed, idx, ok;
                        if (len >= arity) {
                            removed = vcpu.cs.clear(- arity);
                            ok = true;
                            if (this.tests !== undef) {
                                for (idx = 0; ok && idx < arity; idx += 1) {
                                    ok = this.tests[idx](removed[idx]);
                                }
                            }
                            if (ok) {
                                removed.push(len - arity);
                                return this.body.apply(ops, removed);
                            } else {
                                nuError.invalidOperand.apply(undef, removed);
                            }
                        } else {
                            nuError.notEnoughOperands();
                        }
                    }}
                }),
            opcodeTemplate = {
                vcpu:  {value: undef},
                arity: {value: undef},
                tests: {value: undef},
                body:  {value: undef}
            },
            nuOpcode;

        nuOpcode = function (vcpu, tests, body) {
            var op;
            if (typeof tests === 'number') {
                opcodeTemplate.arity.value = tests;
                opcodeTemplate.tests.value = undef;
            } else {
                opcodeTemplate.arity.value = tests.length;
                opcodeTemplate.tests.value = tests;
            }
            opcodeTemplate.vcpu.value = vcpu;
            opcodeTemplate.body.value = body;
            op = Object.create(opcodeBase, opcodeTemplate);
            return function () { return op.invoke(this); };
        };

        nuOpcode.tests = Object.defineProperties(
            {},
            {
                isInteger: {value: function (e) {
                    return typeof e === 'number' && e === Math.round(e);
                }},
                isNonNegativeInteger: {value: function (e) {
                    return typeof e === 'number' && e === Math.round(e) && e >= 0;
                }},
                isString: {value: function (e) {
                    return nuArray.isArray(e) && e.allChars;
                }},
                isExecutable: {value: function (e) {
                    return nuSegment.isSegment(e) || nuStack.isStack(e) ||
                        types.isLexicalAddress(e) || typeof e === 'function';
                }},
                isBoolean: {value: function (e) {
                    return typeof e === 'boolean';
                }},
                any: {value: function (e) {
                    return true;
                }}
            });


        return nuOpcode;

    });
}(typeof define === 'function' ? define : function (factory) { module.exports = factory(); }));
