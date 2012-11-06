(function (define) {
    define(function () {

        'use strict';

        return function (vcpu, ops) {
            Object.defineProperties(
                ops,
                {
                    LOG: {value: function () {
                        if (vcpu.cs.length() > 0) {
                            return console.log(vcpu.cs.pop());
                        } else {
                            throw "NOT ENOUGH OPERANDS (LOG)"; // TODO interrupt handler
                        }
                    }}
                });
            return undefined;
        };

    });
}(typeof define === 'function' ? define : function (factory) { module.exports = factory(); }));
