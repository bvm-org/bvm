(function (define) {
    define(function () {

        'use strict';

        var nuError = require('../errors'),
            nuArray = require('../array'),
            nodePackage = require('../../package');

        return function (vcpu) {
            return {
                LOG: function () {
                    if (vcpu.cs.length() > 0) {
                        vcpu.log(JSON.stringify(vcpu.cs.pop()));
                        return;
                    } else {
                        nuError.notEnoughOperands();
                    }
                },

                VERSION: function () {
                    vcpu.cs.push(nuArray(nodePackage.version));
                    return;
                }
            };
        };

    });
}(typeof define === 'function' ? define : function (factory) { module.exports = factory(); }));
