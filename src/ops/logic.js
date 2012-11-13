(function (define) {
    define(function () {

        'use strict';

        return function (vcpu) {
            var binaryOp = function () {
                var a, b;
                if (vcpu.cs.length() > 1) {
                    b = vcpu.cs.pop();
                    a = vcpu.cs.pop();
                    if (typeof a === 'boolean' && typeof b === 'boolean') {
                        vcpu.cs.push(this(a, b) ? true : false);
                        return;
                    } else {
                        throw "INVALID OPERAND (" + this.name + ")"; // TODO interrupt handler
                    }
                } else {
                    throw "NOT ENOUGH OPERANDS (" + this.name + ")"; // TODO interrupt handler
                }
            },
            and = function (a, b) { return a && b; },
            or =  function (a, b) { return a || b; },
            xor = function (a, b) { return a ^ b; };
            and.name = 'AND', or.name = 'OR', xor.name = 'XOR';

            return {
                AND: binaryOp.bind(and),
                OR:  binaryOp.bind(or),
                XOR: binaryOp.bind(xor),
                NOT: function () {
                    var a;
                    if (vcpu.cs.length() > 0) {
                        a = vcpu.cs.pop();
                        if (typeof a === 'boolean') {
                            vcpu.cs.push((! a) ? true : false);
                            return;
                        } else {
                            throw "INVALID OPERAND (NOT)"; // TODO interrupt handler
                        }
                    } else {
                        throw "NOT ENOUGH OPERANDS (NOT)"; // TODO interrupt handler
                    }
                }
            };
        };

    });
}(typeof define === 'function' ? define : function (factory) { module.exports = factory(); }));
