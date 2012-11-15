(function (define) {
    define(function () {

        'use strict';

        var undef, result;
        result = function (/* ...args... */) {
            var extra = Array.prototype.slice.call(arguments, 0),
                errorName = extra.shift(),
                handler = require('./utils').searchDicts({key: errorName, dicts: result.vcpu.ds}).found,
                opCodeName = result.vcpu.op;
            if (typeof opCodeName === 'function') {
                opCodeName = opCodeName.opCodeName;
            }
            if (opCodeName === undef) {
                opCodeName = require('./types').undef;
            }
            if (require('./segment').isSegment(handler)) {
                result.vcpu.enterSegment(handler, [errorName, result.vcpu.cs, opCodeName].concat(extra));
                return;
            } else {
                throw ('Unhandled error in ' + JSON.stringify(opCodeName) +
                       ': ' + errorName);
            }
        };

        return Object.defineProperties(
            result,
            {
                vcpu: {value: undef, writable: true},
                notEnoughOperands: {value: function () {
                    result.apply(undef, ['ERROR NOT ENOUGH OPERANDS'].concat(
                        Array.prototype.slice.call(arguments, 0)));
                }},
                invalidOperand: {value: function () {
                    result.apply(undef, ['ERROR INVALID OPERAND'].concat(
                        Array.prototype.slice.call(arguments, 0)));
                }},
                internalError: {value: function () {
                    result.apply(undef, ['ERROR INTERNAL ERROR'].concat(
                        Array.prototype.slice.call(arguments, 0)));
                }}
            });

    });
}(typeof define === 'function' ? define : function (factory) { module.exports = factory(); }));
