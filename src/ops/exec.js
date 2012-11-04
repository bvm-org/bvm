(function (define) {
    define(function () {

        'use strict';

        var segmentTypes = require('../segment'),
            nuStack = require('../stack'),
            types = require('../types');

        return function (vcpu, ops) {
            Object.defineProperties(
                ops,
                {
                    EXEC: {value: function () {
                        var len = vcpu.cs.length(), segment, arity, removed;
                        if (len > 1) {
                            arity =  vcpu.cs.pop();
                            len -= 1;
                            if (len < (arity+1)) {
                                throw "NOT ENOUGH OPERANDS (EXEC)"; // TODO interrupt handler
                            } else {
                                removed = vcpu.cs.clear(len - arity);
                                segment = vcpu.cs.pop();

                                if (types.isLexicalAddress(segment)) {
                                    segment = segment.transitiveDereference(vcpu);
                                }

                                if (segmentTypes.isSegment(segment)) {
                                    vcpu.enter(segment, removed, vcpu.cs);
                                    return undefined;
                                } else if (nuStack.isStack(segment)) {
                                    segment = segment.clone(false);
                                    // It is vitally important we do
                                    // this dps assigment *after* the
                                    // clone as it's possible vcpu.cs
                                    // === segment. Thus doing the
                                    // clone first avoids a loop.
                                    segment.dps = vcpu.cs;
                                    vcpu.exit(segment, removed);
                                    return undefined;
                                } else {
                                    throw "INVALID OPERAND (EXEC)"; // TODO interrupt handler
                                }
                            }
                        } else {
                            throw "NOT ENOUGH OPERANDS (EXEC)"; // TODO interrupt handler
                        }
                    }},
                    EXIT: {value: function () {
                        var len = vcpu.cs.length(), resultCount, removed;
                        if (len === 0) {
                            throw "INVALID OPERAND (EXIT)"; // TODO interrupt handler
                        } else {
                            resultCount = vcpu.cs.pop();
                            len -= 1;
                            if (len < resultCount) {
                                throw "INVALID OPERAND (EXIT)"; // TODO interrupt handler
                            } else {
                                removed = vcpu.cs.clear(len - resultCount);
                                vcpu.exit(vcpu.cs.dps, removed);
                                return undefined;
                            }
                        }
                    }},
                    CALLCC: {value: function () {
                        var len = vcpu.cs.length(), segment, arity, removed;
                        if (len > 1) {
                            arity = vcpu.cs.pop();
                            len -= 1;
                            if (len < (arity+1)) {
                                throw "NOT ENOUGH OPERANDS (CALLCC)"; // TODO interrupt handler
                            } else {
                                removed = vcpu.cs.clear(len - arity);
                                removed.push(vcpu.cs);
                                segment = vcpu.cs.pop();

                                if (types.isLexicalAddress(segment)) {
                                    segment = segment.transitiveDereference(vcpu);
                                }

                                if (segmentTypes.isSegment(segment)) {
                                    vcpu.enter(segment, removed, undefined);
                                    return undefined;
                                } else if (nuStack.isStack(segment)) {
                                    // NB we do not do the same dps
                                    // modifications here as in EXEC
                                    vcpu.exit(segment.clone(false), removed);
                                    return undefined;
                                } else {
                                    throw "INVALID OPERAND (CALLCC)"; // TODO interrupt handler
                                }
                            }
                        } else {
                            throw "NOT ENOUGH OPERANDS (CALLCC)"; // TODO interrupt handler
                        }
                    }}
                });
            return undefined;
        };

    });
}(typeof define === 'function' ? define : function (factory) { module.exports = factory(); }));
