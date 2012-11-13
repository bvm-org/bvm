(function (define) {
    define(function () {

        'use strict';

        return function (vcpu) {
            return {
                LOG: function () {
                    if (vcpu.cs.length() > 0) {
                        console.log(vcpu.cs.pop());
                        return;
                    } else {
                        throw "NOT ENOUGH OPERANDS (LOG)"; // TODO interrupt handler
                    }
                }
            };
        };

    });
}(typeof define === 'function' ? define : function (factory) { module.exports = factory(); }));
