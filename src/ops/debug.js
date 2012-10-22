(function (define) {
    define(function () {

        'use strict';

        return function (vcpu, ops) {
            Object.defineProperties(
                ops,
                {
                    LOG: {value: function () {
                        console.log(vcpu.cs.pop());
                        return undefined;
                    }}
                });
            return undefined;
        };

    });
}(typeof define === 'function' ? define : function (factory) { module.exports = factory(); }));
