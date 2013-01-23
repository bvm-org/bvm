(function (define) {
    define(function () {

        'use strict';

        var types = require('../types'),
            utils = require('../utils'),
            nuError = require('../errors'),
            nuOpcode = require('../opcode');

        return function (vcpu) {
            return {
                IF: nuOpcode(
                    vcpu,
                    [nuOpcode.tests.isExecutable, nuOpcode.tests.isBoolean],
                    function (seg, bool) {
                        if (bool) {
                            vcpu.cs.push(seg);
                            this.EXEC();
                            return;
                        }
                    }),
                IF_ELSE: nuOpcode(
                    vcpu,
                    [nuOpcode.tests.isExecutable, nuOpcode.tests.isExecutable, nuOpcode.tests.isBoolean],
                    function (segTrue, segFalse, bool) {
                        vcpu.cs.push(bool ? segTrue : segFalse);
                        this.EXEC();
                    }),
                JUMP: nuOpcode(vcpu, [nuOpcode.tests.isNonNegativeInteger], function (ip) {
                    vcpu.cs.ip.set(ip);
                    return;
                }),
                JUMP_IF: nuOpcode(
                    vcpu, [nuOpcode.tests.isNonNegativeInteger, nuOpcode.tests.isBoolean],
                    function (ip, bool) {
                        if (bool) {
                            vcpu.cs.ip.set(ip);
                        }
                        return;
                    })
            };
        };

    });
}(typeof define === 'function' ? define : function (factory) { module.exports = factory(); }));
