(function (define) {
    define(function () {

        'use strict';

        var types = require('../types'),
            segmentTypes = require('../segment'),
            utils = require('../utils');

        return function (vcpu, ops) {
            Object.defineProperties(
                ops,
                {
                    IF: {value: function () {
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
                                return undefined;
                            } else {
                                throw "INVALID OPERAND (IF)"; // TODO interrupt handler
                            }
                        } else {
                            throw "NOT ENOUGH OPERANDS (IF)"; // TODO interrupt handler
                        }
                    }},

                    IFELSE: {value: function () {
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
                    }}
                });
        };

    });
}(typeof define === 'function' ? define : function (factory) { module.exports = factory(); }));
