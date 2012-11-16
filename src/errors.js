(function (define) {
    define(function () {

        'use strict';

        var undef, result;
        result = function (/* ...args... */) {
            var args = Array.prototype.slice.call(arguments, 0),
                errorName = args[args.length - 1],
                handler = require('./utils').searchDicts({key: errorName, dicts: result.vcpu.ds}).found,
                opCodeName = result.vcpu.op;
            if (typeof opCodeName === 'function') {
                opCodeName = opCodeName.opCodeName;
            }
            if (opCodeName === undef) {
                opCodeName = require('./types').undef;
            }
            if (require('./segment').isSegment(handler)) {
                args.push(opCodeName, result.vcpu.cs);
                result.vcpu.cs.appendArray(args),
                result.vcpu.enterSegment(handler, Object.getPrototypeOf(result.vcpu.cs));
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
                    result.apply(undef, Array.prototype.slice.call(arguments, 0).concat(
                        ['ERROR NOT ENOUGH OPERANDS']));
                }},
                invalidOperand: {value: function () {
                    result.apply(undef, Array.prototype.slice.call(arguments, 0).concat(
                        ['ERROR INVALID OPERAND']));
                }},
                internalError: {value: function () {
                    result.apply(undef, Array.prototype.slice.call(arguments, 0).concat(
                        ['ERROR INTERNAL ERROR']));
                }}
            });

    });
}(typeof define === 'function' ? define : function (factory) { module.exports = factory(); }));
