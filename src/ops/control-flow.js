(function (define) {
    define(function () {

        'use strict';

        var types = require('../types'),
            utils = require('../utils'),
            nuError = require('../errors');

        return function (vcpu) {
            return {
                IF: function () {
                    var len = vcpu.cs.length(), val, n;
                    if (len > 1) {
                        val = vcpu.cs.pop();
                        if (val === true) { // yes, really!
                            return this.EXEC();
                        } else if (val === false) {
                            len -= 2;
                            n = vcpu.cs.index(len);
                            if (typeof n === 'number') {
                                len -= n + 1;
                                n += 2; // 1 for n, and 1 for the SEG
                            } else {
                                n = 1;
                            }
                            vcpu.cs.clear(len, n);
                            return;
                        } else {
                            nuError.invalidOperand(val);
                        }
                    } else {
                        nuError.notEnoughOperands();
                    }
                },
                IF_ELSE: function () {
                    var len = vcpu.cs.length(), val, n;
                    if (len > 2) {
                        val = vcpu.cs.pop();
                        len -= 2;
                        if (val === true) {
                            n = vcpu.cs.index(len);
                            if (typeof n === 'number') {
                                len -= n + 1;
                                n += 2; // 1 for n, and 1 for the SEG
                            } else {
                                n = 1;
                            }
                            if (len < 1) {
                                nuError.notEnoughOperands();
                            }
                            vcpu.cs.clear(len, n);
                            return this.EXEC();
                        } else if (val === false) {
                            n = vcpu.cs.index(len);
                            if (typeof n === 'number') {
                                n += 2; // 1 for n, and 1 for the SEG
                            } else {
                                n = 1;
                            }
                            len -= n;
                            if (len < 0) {
                                nuError.notEnoughOperands();
                            }
                            n = vcpu.cs.index(len);
                            if (typeof n === 'number') {
                                len -= n + 1;
                                n += 2; // 1 for n, and 1 for the SEG
                            } else {
                                n = 1;
                            }
                            if (len < 0) {
                                nuError.notEnoughOperands();
                            } else {
                                vcpu.cs.clear(len, n);
                                return this.EXEC();
                            }
                        } else {
                            nuError.invalidOperand(val);
                        }
                    } else {
                        nuError.notEnoughOperands();
                    }
                },
                JUMP: function () {
                    if (vcpu.cs.length() > 0) {
                        vcpu.cs.ip.set(vcpu.cs.pop());
                    } else {
                        nuError.notEnoughOperands();
                    }
                },
                JUMP_IF: function () {
                    var val;
                    if (vcpu.cs.length() > 1) {
                        val = vcpu.cs.pop();
                        if (val === true) {
                            vcpu.cs.ip.set(vcpu.cs.pop());
                            return;
                        } else if (val === false) {
                            vcpu.cs.pop();
                            return;
                        } else {
                            nuError.invalidOperand(val);
                        }
                    } else {
                        nuError.notEnoughOperands();
                    }
                }
            };
        };

    });
}(typeof define === 'function' ? define : function (factory) { module.exports = factory(); }));
