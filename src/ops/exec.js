(function (define) {
    define(function () {

        'use strict';

        var segmentTypes = require('../segment'),
            nuStack = require('../stack'),
            types = require('../types'),
            utils = require('../utils'),
            nuError = require('../errors');

        return function (vcpu) {
            return {
                EXEC: function () {
                    var call = utils.prepareForCall(vcpu),
                    dps = utils.detectTailCall(vcpu);

                    if (segmentTypes.isSegment(call.seg)) {
                        vcpu.enterSegment(call.seg, call.args, dps);
                        return;
                    } else if (nuStack.isStack(call.seg)) {
                        call.seg = call.seg.clone(true);
                        // It is vitally important we do this dps
                        // assigment *after* the clone as it's
                        // possible vcpu.cs === segment. Thus
                        // doing the clone first avoids a loop.
                        call.seg.dps = dps;
                        vcpu.enterStack(call.seg, call.args);
                        return;
                    } else if (typeof call.seg === 'function') {
                        vcpu.cs.appendArray(call.args);
                        vcpu.dispatch(call.seg);
                        return;
                    } else {
                        nuError.invalidOperand(call.seg);
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
                    var call = utils.prepareForCall(vcpu);
                    call.args.push(vcpu.cs);

                    if (segmentTypes.isSegment(call.seg)) {
                        vcpu.enterSegment(call.seg, call.args);
                        return;
                    } else if (nuStack.isStack(call.seg)) {
                        // NB we do not do the same dps
                        // modifications here as in EXEC
                        vcpu.enterStack(call.seg.clone(true), call.args);
                        return;
                    } else {
                        nuError.invalidOperand(call.seg);
                    }
                }
            };
        };

    });
}(typeof define === 'function' ? define : function (factory) { module.exports = factory(); }));
