(function (define) {
    define(function () {

        'use strict';

        var types = require('../types');
        var nuArray = require('../array');

        return function (vcpu, ops) {
            Object.defineProperties(
                ops,
                {
                    ARRAY_START: {value: function () {
                        this.MARK();
                        return undefined;
                    }},
                    ARRAY_END: {value: function () {
                        var len = vcpu.cs.length(), mark = vcpu.cs.lastIndexOf(types.mark),
                            removed;
                        if (mark === -1) {
                            throw "INVALID OPERAND (ARRAY_END)"; // TODO interrupt handler
                        } else {
                            removed = vcpu.cs.clear(mark);
                            removed.shift(); // drop the initial mark
                            vcpu.cs.push(nuArray(removed));
                            return undefined;
                        }
                    }},
                });
            return undefined;
        };

    });
}(typeof define === 'function' ? define : function (factory) { module.exports = factory(); }));
