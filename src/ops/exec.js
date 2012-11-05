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
                        var len = vcpu.cs.length(), segment, arity, removed, dps;
                        if (len > 0) {
                            arity = vcpu.cs.pop();
                            len -= 1;
                            if (typeof arity === 'number') {
                                if (len < (arity+1) || arity < 0) {
                                    throw "NOT ENOUGH OPERANDS (EXEC)"; // TODO interrupt handler
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

                            // Tail-call optimisation
                            dps = vcpu.cs.ip.isExhausted() ? vcpu.cs.dps : vcpu.cs;

                            if (segmentTypes.isSegment(segment)) {
                                vcpu.enterSegment(segment, removed, dps);
                                return undefined;
                            } else if (nuStack.isStack(segment)) {
                                segment = segment.clone(false);
                                // It is vitally important we do this
                                // dps assigment *after* the clone as
                                // it's possible vcpu.cs ===
                                // segment. Thus doing the clone first
                                // avoids a loop.
                                segment.dps = dps;
                                vcpu.enterStack(segment, removed);
                                return undefined;
                            } else {
                                throw "INVALID OPERAND (EXEC)"; // TODO interrupt handler
                            }
                        } else {
                            throw "NOT ENOUGH OPERANDS (EXEC)"; // TODO interrupt handler
                        }
                    }},
                    EXIT: {value: function () {
                        var len = vcpu.cs.length(), resultCount, removed;
                        if (len === 0) {
                            resultCount = 0;
                        } else {
                            resultCount = vcpu.cs.pop();
                            if (typeof resultCount === 'number') {
                                len -= 1;
                                if (len < resultCount) {
                                    throw "INVALID OPERAND (EXIT)"; // TODO interrupt handler
                                } else {
                                    removed = vcpu.cs.clear(len - resultCount);
                                }
                            } else {
                                removed = [];
                            }
                            vcpu.enterStack(vcpu.cs.dps, removed);
                            return undefined;
                        }
                    }},
                    CALLCC: {value: function () {
                        var len = vcpu.cs.length(), segment, arity, removed;
                        if (len > 0) {
                            arity = vcpu.cs.pop();
                            len -= 1;
                            if (typeof arity === 'number') {
                                if (len < (arity+1) || arity < 0) {
                                    throw "NOT ENOUGH OPERANDS (CALLCC)"; // TODO interrupt handler
                                } else {
                                    removed = vcpu.cs.clear(len - arity);
                                    removed.push(vcpu.cs);
                                    segment = vcpu.cs.pop();
                                }
                            } else {
                                removed = [vcpu.cs];
                                segment = arity;
                            }

                            if (types.isLexicalAddress(segment)) {
                                segment = segment.transitiveDereference(vcpu);
                            }

                            if (segmentTypes.isSegment(segment)) {
                                vcpu.enterSegment(segment, removed, undefined);
                                return undefined;
                            } else if (nuStack.isStack(segment)) {
                                // NB we do not do the same dps
                                // modifications here as in EXEC
                                vcpu.enterStack(segment.clone(false), removed);
                                return undefined;
                            } else {
                                throw "INVALID OPERAND (CALLCC)"; // TODO interrupt handler
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
