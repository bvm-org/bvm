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
                        vcpu.cs.push(this.fun(a, b) ? true : false);
                        return;
                    } else {
                        throw "INVALID OPERAND (" + this.name + ")"; // TODO interrupt handler
                    }
                } else {
                    throw "NOT ENOUGH OPERANDS (" + this.name + ")"; // TODO interrupt handler
                }
            },
            and = {fun: function (a, b) { return a && b; }, name: 'AND'},
            or  = {fun: function (a, b) { return a || b; }, name: 'OR' },
            xor = {fun: function (a, b) { return a ^ b;  }, name: 'XOR'},
            result;

            result = {
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

            [and, or, xor].forEach(
                function (binFun) {result[binFun.name] = binaryOp.bind(binFun); });

            return result;
        };

    });
}(typeof define === 'function' ? define : function (factory) { module.exports = factory(); }));
