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
                        var len = vcpu.cs.length(), segment, removed;
                        if (len === 0) {
                            throw "INVALID OPERAND (EXEC)"; // TODO interrupt handler
                        } else {
                            segment = vcpu.cs.pop();
                            len -= 1;
                            if (types.isAddressCouplet(segment)) {
                                segment = segment.transitiveDereference(vcpu);
                            }

                            if (segmentTypes.isSegment(segment)) {
                                if (len < segment.arity) {
                                    throw "INVALID OPERAND (EXEC)"; // TODO interrupt handler
                                } else {
                                    removed = vcpu.cs.clear(len - segment.arity);
                                    vcpu.enter(segment, removed, vcpu.cs);
                                    return undefined;
                                }
                            } else if (nuStack.isStack(segment)) {
                                if (len === 0) {
                                    throw "INVALID OPERAND (EXEC)"; // TODO interrupt handler
                                } else {
                                    segment = segment.clone(false);
                                    // It is vitally important we do
                                    // this dps assigment *after* the
                                    // clone as it's possible vcpu.cs
                                    // === segment. Thus doing the
                                    // clone first avoids a loop.
                                    segment.dps = vcpu.cs;
                                    vcpu.exit(segment, [vcpu.cs.pop()]);
                                    return undefined;
                                }
                            } else {
                                vcpu.cs.push(segment);
                                return undefined;
                            }
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
                    SUSPEND: {value: function () {
                        var len = vcpu.cs.length(), segment, removed;
                        if (len === 0) {
                            throw "INVALID OPERAND (SUSPEND)"; // TODO interrupt handler
                        } else {
                            segment = vcpu.cs.pop();
                            len -= 1;
                            if (types.isAddressCouplet(segment)) {
                                segment = segment.transitiveDereference(vcpu);
                            }

                            if (segmentTypes.isSegment(segment)) {
                                if (len < (segment.arity - 1)) {
                                    throw "INVALID OPERAND (SUSPEND)"; // TODO interrupt handler
                                } else {
                                    removed = vcpu.cs.clear(len - (segment.arity - 1));
                                    removed.push(vcpu.cs);
                                    vcpu.enter(segment, removed, undefined);
                                    return undefined;
                                }
                            } else if (nuStack.isStack(segment)) {
                                // NB we do not do the same dps
                                // modifications here as in EXEC
                                vcpu.exit(segment.clone(false), [vcpu.cs]);
                                return undefined;
                            } else {
                                throw "INVALID OPERAND (SUSPEND)"; // TODO interrupt handler
                            }
                        }
                    }}
                });
            return undefined;
        };

    });
}(typeof define === 'function' ? define : function (factory) { module.exports = factory(); }));
