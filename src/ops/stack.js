(function (define) {
    define(function () {

        'use strict';

        return function (vcpu, ops) {
            Object.defineProperties(
                ops,
                {
                    PUSH: {value: function () {
                        vcpu.cs.push(vcpu.cs.ip.fetch());
                        return undefined;
                    }},
                    POP: {value: function () {
                        if (vcpu.cs.length() > 0) {
                            return vcpu.cs.pop();
                        } else {
                            throw "NOT ENOUGH OPERANDS (POP)"; // TODO interrupt handler
                        }
                    }},
                    DUPLICATE: {value: function () {
                        var len = vcpu.cs.length();
                        if (len > 0) {
                            vcpu.cs.push(vcpu.cs.index(len - 1));
                            return undefined;
                        } else {
                            throw "NOT ENOUGH OPERANDS (DUPLICATE)"; // TODO interrupt handler
                        }
                    }},
                    EXCHANGE: {value: function () {
                        var len = vcpu.cs.length(), tmp;
                        if (len > 1) {
                            len -= 1;
                            tmp = vcpu.cs.index(len);
                            vcpu.cs.store(len, vcpu.cs.index(len - 1));
                            vcpu.cs.store(len - 1, tmp);
                            return undefined;
                        } else {
                            throw "NOT ENOUGH OPERANDS (EXCHANGE)"; // TODO interrupt handler
                        }
                    }},
                    COUNT: {value: function () {
                        vcpu.cs.push(vcpu.cs.length());
                        return undefined;
                    }}
                    // TODO: COPY, ROLL, INDEX
                });
            return undefined;
        };

    });
}(typeof define === 'function' ? define : function (factory) { module.exports = factory(); }));
