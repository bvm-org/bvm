(function (define) {
    define(function () {

        'use strict';

        var nuError = require('../errors');

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
                        nuError.invalidOperand(a, b);
                    }
                } else {
                    nuError.notEnoughOperands();
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
                            nuError.invalidOperand(a);
                        }
                    } else {
                        nuError.notEnoughOperands();
                    }
                }
            };

            [and, or, xor].forEach(
                function (binFun) {result[binFun.name] = binaryOp.bind(binFun); });

            return result;
        };

    });
}(typeof define === 'function' ? define : function (factory) { module.exports = factory(); }));
