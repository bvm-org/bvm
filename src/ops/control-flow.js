(function (define) {
    define(function () {

        'use strict';

        var types = require('../types'),
            segmentTypes = require('../segment'),
            utils = require('../utils');

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
                            throw "INVALID OPERAND (IF)"; // TODO interrupt handler
                        }
                    } else {
                        throw "NOT ENOUGH OPERANDS (IF)"; // TODO interrupt handler
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
                            n = vcpu.cs.index(len);
                            if (typeof n === 'number') {
                                len -= n + 1;
                                n += 2; // 1 for n, and 1 for the SEG
                            } else {
                                n = 1;
                            }
                            vcpu.cs.clear(len, n);
                            return this.EXEC();
                        } else {
                            throw "INVALID OPERAND (IF_ELSE)"; // TODO interrupt handler
                        }
                    } else {
                        throw "NOT ENOUGH OPERANDS (IF_ELSE)"; // TODO interrupt handler
                    }
                },
                JUMP: function () {
                    var val;
                    if (vcpu.cs.length() > 0) {
                        val = vcpu.cs.pop();
                        if (typeof val === 'number') {
                            vcpu.cs.ip.set(val);
                            return;
                        } else {
                            throw "INVALID OPERAND (JUMP)"; // TODO interrupt handler
                        }
                    } else {
                        throw "NOT ENOUGH OPERANDS (JUMP)"; // TODO interrupt handler
                    }
                },
                JUMP_IF: function () {
                    var val;
                    if (vcpu.cs.length() > 1) {
                        val = vcpu.cs.pop();
                        if (val === true) {
                            val = vcpu.cs.pop();
                            if (typeof val === 'number') {
                                vcpu.cs.ip.set(val);
                                return;
                            } else {
                                throw "INVALID OPERAND (JUMP_IF)"; // TODO interrupt handler
                            }
                        } else if (val === false) {
                            vcpu.cs.pop();
                            return;
                        } else {
                            throw "INVALID OPERAND (JUMP_IF)"; // TODO interrupt handler
                        }
                    } else {
                        throw "NOT ENOUGH OPERANDS (JUMP_IF)"; // TODO interrupt handler
                    }
                }
            };
        };

    });
}(typeof define === 'function' ? define : function (factory) { module.exports = factory(); }));
