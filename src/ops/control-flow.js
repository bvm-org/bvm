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
                        var val, call;
                        if (vcpu.cs.length() > 1) {
                            val = vcpu.cs.pop();
                            call = utils.prepareForCall(vcpu, "IF");
                            if (val === true) { // yes, really!
                                vcpu.enterSegment(call.seg, call.args,
                                                  utils.detectTailCall(vcpu));
                            } else if (typeof val !== 'boolean') {
                                throw "INVALID OPERAND (IF)"; // TODO interrupt handler
                            }
                        } else {
                            throw "NOT ENOUGH OPERANDS (IF)"; // TODO interrupt handler
                        }
                    }},

                    IFELSE: {value: function () {
                        var val, tCall, fCall;
                        if (vcpu.cs.length() > 2) {
                            val = vcpu.cs.pop();
                            fCall = utils.prepareForCall(vcpu, "IFELSE");
                            tCall = utils.prepareForCall(vcpu, "IFELSE");
                            if (val === true) {
                                vcpu.enterSegment(tCall.seg, tCall.args,
                                                  utils.detectTailCall(vcpu));
                            } else if (val === false) {
                                vcpu.enterSegment(fCall.seg, fCall.args,
                                                  utils.detectTailCall(vcpu));
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
