(function (define) {
    define(function () {

        'use strict';

        var undef,
            nuError = require('./errors'),
            nuArray = require('./array'),
            opcodeBase = Object.defineProperties(
                {},
                {
                    invoke: {value: function () {
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
                                return this.body.apply(undef, removed);
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
            return op.invoke.bind(op);
        };

        nuOpcode.tests = Object.defineProperties(
            {},
            {
                isInteger: {value: function (e) {
                    return typeof e === 'number' && e === Math.round(e);
                }},
                isString: {value: function (e) {
                    return nuArray.isArray(e) && e.allChars;
                }},
                any: {value: function (e) {
                    return true;
                }}
            });


        return nuOpcode;

    });
}(typeof define === 'function' ? define : function (factory) { module.exports = factory(); }));
