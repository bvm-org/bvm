(function (define) {
    define(function () {

        'use strict';

        var undef,
            id = {},
            errorBase = {id: id},
            errorTemplate = {opCodeName: {value: undef, writable: true},
                             errorName: {value: undef},
                             extra: {value: undef}},
            result;

        result = function (/* ...args... */) {
            var extra = Array.prototype.slice.call(arguments, 0);
            errorTemplate.errorName.value = extra.shift();
            errorTemplate.extra.value = extra;
            throw Object.create(errorBase, errorTemplate);
        };

        return Object.defineProperties(
            result,
            {
                handle: {value: function (vcpu, error) {
                    // do the requires here to break a cyclical require
                    var handler = require('./utils').searchDicts({key: error.errorName, dicts: vcpu.ds});
                    if (require('./segment').isSegment(handler.found)) {
                        vcpu.enterSegment(
                            handler.found,
                            [error.errorName, vcpu.cs, error.opCodeName].concat(error.extra));
                        return;
                    } else {
                        throw ('Unhandled error in ' + JSON.stringify(error.opCodeName) +
                               ': ' + error.errorName);
                    }
                }},

                isError: {value: function (thing) {
                    return typeof thing === 'object' &&
                        thing.id === id;
                }},

                notEnoughOperands: {value: function () {
                    result.apply(undef, ['NOT ENOUGH OPERANDS'].concat(
                        Array.prototype.slice.call(arguments, 0)));
                }},
                invalidOperand: {value: function () {
                    result.apply(undef, ['INVALID OPERAND'].concat(
                        Array.prototype.slice.call(arguments, 0)));
                }},
                internalError: {value: function () {
                    result.apply(undef, ['INTERNAL ERROR'].concat(
                        Array.prototype.slice.call(arguments, 0)));
                }}
            });

    });
}(typeof define === 'function' ? define : function (factory) { module.exports = factory(); }));
