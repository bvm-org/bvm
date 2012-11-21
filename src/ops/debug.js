(function (define) {
    define(function () {

        'use strict';

        var nuError = require('../errors');

        return function (vcpu) {
            return {
                LOG: function () {
                    if (vcpu.cs.length() > 0) {
                        vcpu.log(JSON.stringify(vcpu.cs.pop()));
                        return;
                    } else {
                        nuError.notEnoughOperands();
                    }
                }
            };
        };

    });
}(typeof define === 'function' ? define : function (factory) { module.exports = factory(); }));
