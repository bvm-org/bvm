(function (define) {
    define(function () {

        'use strict';

        var types = require('../types');

        return function (vcpu) {
            return {
                MARK: function () {
                    vcpu.cs.push(types.mark);
                    return;
                },
                COUNT_TO_MARK: function () {
                    var len = vcpu.cs.length(), mark = vcpu.cs.lastIndexOf(types.mark);
                    if (mark === -1) {
                        throw "INVALID OPERAND (COUNT_TO_MARK)"; // TODO interrupt handler
                    } else {
                        vcpu.cs.push((len - mark) - 1);
                        return;
                    }
                },
                CLEAR_TO_MARK: function () {
                    var mark = vcpu.cs.lastIndexOf(types.mark);
                    if (mark === -1) {
                        throw "INVALID OPERAND (CLEAR_TO_MARK)"; // TODO interrupt handler
                    } else {
                        vcpu.cs.clear(mark);
                        return;
                    }
                }
            };
        };

    });
}(typeof define === 'function' ? define : function (factory) { module.exports = factory(); }));
