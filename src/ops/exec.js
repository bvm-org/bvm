(function (define) {
    define(function () {

        'use strict';

        var nuSegment = require('../segment'),
            nuStack = require('../stack'),
            types = require('../types'),
            utils = require('../utils'),
            nuError = require('../errors'),
            nuOpcode = require('../opcode'),
            undef;

        return function (vcpu) {
            return {
                EXEC: function () {
                    var segment = utils.prepareForCall(vcpu),
                        dps = utils.detectTailCall(vcpu);

                    if (nuSegment.isSegment(segment)) {
                        vcpu.enterSegment(segment, vcpu.cs.asArray(), dps);
                        return;
                    } else if (nuStack.isStack(segment)) {
                        // Note that whilst we clone the stack, the
                        // `true` here indicates we are explicitly
                        // sharing the underlying array, thus values
                        // are preserved across multiple invocations.
                        segment = segment.clone(true);
                        // It is vitally important we do this dps
                        // assigment *after* the clone as it's
                        // possible vcpu.cs === segment. Thus
                        // doing the clone first avoids a loop.
                        segment.dps = dps;
                        segment.ts = vcpu.cs.asArray();
                        vcpu.enterStack(segment);
                        return;
                    } else if (segment === utils.callPrepareError) {
                        return;
                    } else if (typeof segment === 'function') {
                        vcpu.dispatch(segment);
                        return;
                    } else {
                        nuError.invalidOperand(segment);
                    }
                },
                RETURN: function () {
                    var len = vcpu.cs.length(), resultCount, removed;
                    if (len === 0) {
                        removed = [];
                    } else {
                        resultCount = vcpu.cs.pop();
                        if (typeof resultCount === 'number') {
                            len -= 1;
                            if (len < resultCount) {
                                nuError.notEnoughOperands();
                            } else {
                                removed = vcpu.cs.clear(len - resultCount);
                            }
                        } else {
                            removed = [];
                        }
                    }
                    vcpu.enterStack(vcpu.cs.dps, removed);
                    return;
                },
                CALLCC: function () {
                    var segment = utils.prepareForCall(vcpu);
                    vcpu.cs.push(vcpu.cs);

                    if (nuSegment.isSegment(segment)) {
                        vcpu.enterSegment(segment, vcpu.cs.asArray());
                        return;
                    } else if (nuStack.isStack(segment)) {
                        // NB we do not do the same dps
                        // modifications here as in EXEC
                        segment = segment.clone(true);
                        segment.ts = vcpu.cs.asArray();
                        vcpu.enterStack(segment);
                        return;
                    } else if (segment === utils.callPrepareError) {
                        return;
                    } else {
                        nuError.invalidOperand(segment);
                    }
                },
                TAKE: nuOpcode(
                    vcpu,
                    [function (e) {
                        return nuOpcode.tests.isNonNegativeInteger(e) &&
                            vcpu.cs.ts !== undef && vcpu.cs.ts.length() >= e;
                    }],
                    function (count) {
                        vcpu.cs.appendArray(vcpu.cs.ts.clear(- count));
                        return;
                    }),
                TAKE_COUNT: function () {
                    if (vcpu.cs.ts === undef) {
                        vcpu.cs.push(0);
                        return;
                    } else {
                        vcpu.cs.push(vcpu.cs.ts.length());
                        return;
                    }
                }
            };
        };

    });
}(typeof define === 'function' ? define : function (factory) { module.exports = factory(); }));
