(function (define) {
    define(function () {

        'use strict';

        return function (vcpu) {
            var binaryOp = function (fun, opStr) {
                var a, b;
                if (vcpu.cs.length() > 1) {
                    b = vcpu.cs.pop();
                    a = vcpu.cs.pop();
                    if (typeof a === 'boolean' && typeof b === 'boolean') {
                        vcpu.cs.push(fun(a, b) ? true : false);
                        return undefined;
                    } else {
                        throw "INVALID OPERAND (" + opStr + ")"; // TODO interrupt handler
                    }
                } else {
                    throw "NOT ENOUGH OPERANDS (" + opStr + ")"; // TODO interrupt handler
                }
            },
            and = function (a, b) { return a && b; },
            or =  function (a, b) { return a || b; },
            xor =  function (a, b) { return a ^ b; };

            return {
                AND: function () { return binaryOp(and, 'AND'); },
                OR:  function () { return binaryOp(or, 'OR'); },
                XOR: function () { return binaryOp(xor, 'XOR'); },
                NOT: function () {
                    var a;
                    if (vcpu.cs.length() > 0) {
                        a = vcpu.cs.pop();
                        if (typeof a === 'boolean') {
                            vcpu.cs.push((! a) ? true : false);
                            return undefined;
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
