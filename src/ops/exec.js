(function (define) {
    define(function () {

        'use strict';

        var nuSegment = require('../segment'),
            nuStack = require('../stack'),
            types = require('../types'),
            utils = require('../utils'),
            nuError = require('../errors'),
            undef;

        return function (vcpu) {
            return {
                EXEC: function () {
                    var segment = utils.prepareForCall(vcpu),
                        dps = utils.detectTailCall(vcpu);

                    if (nuSegment.isSegment(segment)) {
                        vcpu.enterSegment(segment, Object.getPrototypeOf(vcpu.cs), dps);
                        return;
                    } else if (nuStack.isStack(segment)) {
                        segment = segment.clone(true);
                        // It is vitally important we do this dps
                        // assigment *after* the clone as it's
                        // possible vcpu.cs === segment. Thus
                        // doing the clone first avoids a loop.
                        segment.dps = dps;
                        segment.ts = Object.getPrototypeOf(vcpu.cs);
                        vcpu.enterStack(segment);
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
                        vcpu.enterSegment(segment, Object.getPrototypeOf(vcpu.cs));
                        return;
                    } else if (nuStack.isStack(segment)) {
                        // NB we do not do the same dps
                        // modifications here as in EXEC
                        segment = segment.clone(true);
                        segment.ts = Object.getPrototypeOf(vcpu.cs);
                        vcpu.enterStack(segment);
                        return;
                    } else {
                        nuError.invalidOperand(segment);
                    }
                },
                TAKE: function () {
                    var n, plen;
                    if (vcpu.cs.length() > 0) {
                        n = vcpu.cs.pop();
                        if (typeof n === 'number' &&
                            n >= 0 && vcpu.cs.ts !== undef &&
                            (plen = vcpu.cs.ts.length()) >= n) {
                            vcpu.cs.appendArray(vcpu.cs.ts.clear(plen - n));
                            return;
                        } else {
                            nuError.invalidOperand(n);
                        }
                    } else {
                        nuError.notEnoughOperands();
                    }
                },
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
