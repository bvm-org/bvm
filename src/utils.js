(function (define) {
    define(function () {

        'use strict';

        var types = require('./types'),
            segmentTypes = require('./segment'),
            nuStack = require('./stack');

        return Object.create(
            {},
            {
                prepareForCall: {value: function (vcpu, opName) {
                    var len = vcpu.cs.length(), arity, removed, segment;
                    if (len > 0) {
                        arity = vcpu.cs.pop();
                        len -= 1;
                        if (typeof arity === 'number') {
                            if (len < (arity+1) || arity < 0) {
                                throw "NOT ENOUGH OPERANDS (" + opName + ")"; // TODO interrupt handler
                            } else {
                                removed = vcpu.cs.clear(len - arity);
                                segment = vcpu.cs.pop();
                            }
                        } else {
                            removed = [];
                            segment = arity;
                        }

                        if (types.isLexicalAddress(segment)) {
                            segment = segment.transitiveDereference(vcpu);
                        }

                        return {seg: segment, args: removed};
                    } else {
                        throw "NOT ENOUGH OPERANDS (" + opName + ")"; // TODO interrupt handler
                    }
                }},

                detectTailCall: {value: function (vcpu) {
                    return vcpu.cs.ip.isExhausted() ? vcpu.cs.dps : vcpu.cs;
                }},

                isExecutable: {value: function (thing, ops) {
                    return segmentTypes.isSegment(thing) ||
                        nuStack.isStack(thing) ||
                        (typeof thing === 'function' && thing.ops === ops);
                }}
            });

    });
}(typeof define === 'function' ? define : function (factory) { module.exports = factory(); }));
