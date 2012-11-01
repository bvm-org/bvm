(function (define) {
    define(function () {

        'use strict';

        var types = require('../types'),
            segmentTypes = require('../segment');

        return function (vcpu, ops) {
            Object.defineProperties(
                ops,
                {
                    IF: {value: function () {
                        var val, seg;
                        if (vcpu.cs.length() > 1) {
                            seg = vcpu.cs.pop();
                            val = vcpu.cs.pop();
                            if (segmentTypes.isSegment(seg) && typeof val === 'boolean') {
                                val ? vcpu.enter(seg) : undefined;
                                return undefined;
                            } else {
                                throw "INVALID OPERAND (IF)"; // TODO interrupt handler
                            }
                        } else {
                            throw "NOT ENOUGH OPERANDS (IF)"; // TODO interrupt handler
                        }
                    }},

                    IF_ELSE: {value: function () {
                        var val, tseg, fseg;
                        if (vcpu.cs.length() > 2) {
                            fseg = vcpu.cs.pop();
                            tseg = vcpu.cs.pop();
                            val = vcpu.cs.pop();
                            if (segmentTypes.isSegment(fseg) &&
                                segmentTypes.isSegment(tseg) &&
                                typeof val === 'boolean') {
                                val ? vcpu.enter(tseg) : vcpu.enter(fseg);
                                return undefined;
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
