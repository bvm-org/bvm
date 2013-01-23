(function (define) {
    define(function () {

        'use strict';

        var nuError = require('../errors'),
            nuArray = require('../array'),
            nodePackage = require('../../package'),
            nuOpcode = require('../opcode');

        return function (vcpu) {
            return {
                LOG: nuOpcode(vcpu, 1, function (e) {
                    vcpu.log(JSON.stringify(e));
                    return;
                }),

                VERSION: function () {
                    vcpu.cs.push(nuArray(nodePackage.version));
                    return;
                }
            };
        };

    });
}(typeof define === 'function' ? define : function (factory) { module.exports = factory(); }));
