(function (define) {
    define(function () {

        'use strict';

        var types = require('../types'),
            nuError = require('../errors');

        return function (vcpu) {
            var result = {},
            binaryOp = function () {
                var a, b;
                if (vcpu.cs.length() > 1) {
                    b = vcpu.cs.pop();
                    a = vcpu.cs.pop();
                    if (typeof a === 'number' && typeof b === 'number') {
                        vcpu.cs.push(this.fun(a, b));
                        return;
                    } else {
                        nuError.invalidOperand(a, b);
                    }
                } else {
                    nuError.notEnoughOperands();
                }
            },
            unaryOp = function () {
                var a;
                if (vcpu.cs.length() > 0) {
                    a = vcpu.cs.pop();
                    if (typeof a === 'number') {
                        vcpu.cs.push(this.fun(a));
                        return;
                    } else {
                        nuError.invalidOperand(a);
                    }
                } else {
                    nuError.notEnoughOperands();
                }
            },
            binaries = [
                {fun: function (a, b) { return a + b; }, name: 'ADD'},
                {fun: function (a, b) { return a - b; }, name: 'SUBTRACT'},
                {fun: function (a, b) { return a * b; }, name: 'MULTIPLY'},
                {fun: function (a, b) { return a / b; }, name: 'DIVIDE'},
                {fun: function (a, b) { return a % b; }, name: 'MODULUS'},
                {fun: function (a, b) { return Math.max(a, b); }, name: 'MAX'},
                {fun: function (a, b) { return Math.min(a, b); }, name: 'MIN'},
                {fun: function (a, b) { return Math.pow(a, b); }, name: 'POW'}],
            unaries = [
                {fun: Math.abs, name: 'ABS'},
                {fun: function (a) { return -a; }, name: 'NEGATE'},
                {fun: Math.ceil, name: 'CEILING'},
                {fun: Math.floor, name: 'FLOOR'},
                {fun: Math.round, name: 'ROUND'},
                {fun: Math.log, name: 'LOG_E'},
                {fun: function (a) { return a + 1; }, name: 'INC'},
                {fun: function (a) { return a - 1; }, name: 'DEC'}];

            binaries.forEach(
                function (binFun) { result[binFun.name] = binaryOp.bind(binFun); });

            unaries.forEach(
                function (unFun) { result[unFun.name] = unaryOp.bind(unFun); });

            return result;
        };

    });
}(typeof define === 'function' ? define : function (factory) { module.exports = factory(); }));
