(function (define) {
    define(function () {

        'use strict';

        var types = require('../types');

        return function (vcpu, ops) {
            Object.defineProperties(
                ops,
                {
                    MARK: {value: function () {
                        vcpu.cs.push(types.mark);
                        return undefined;
                    }},
                    COUNT_TO_MARK: {value: function () {
                        var len = vcpu.cs.length(), mark = vcpu.cs.lastIndexOf(types.mark);
                        if (mark === -1) {
                            throw "INVALID OPERAND (COUNT_TO_MARK)"; // TODO interrupt handler
                        } else {
                            vcpu.cs.push((len - mark) - 1);
                            return undefined;
                        }
                    }},
                    CLEAR_TO_MARK: {value: function () {
                        var mark = vcpu.cs.lastIndexOf(types.mark);
                        if (mark === -1) {
                            throw "INVALID OPERAND (CLEAR_TO_MARK)"; // TODO interrupt handler
                        } else {
                            vcpu.cs.clear(mark);
                            return undefined;
                        }
                    }}
                });
            return undefined;
        };

    });
}(typeof define === 'function' ? define : function (factory) { module.exports = factory(); }));
