(function (define) {
    define(function () {

        'use strict';

        var segmentTypes = require('../segment'),
            nuStack = require('../stack'),
            types = require('../types'),
            utils = require('../utils');

        return function (vcpu) {
            return {
                EXEC: {value: function () {
                    var call = utils.prepareForCall(vcpu, "EXEC"),
                    dps = utils.detectTailCall(vcpu);

                    if (segmentTypes.isSegment(call.seg)) {
                        vcpu.enterSegment(call.seg, call.args, dps);
                        return undefined;
                    } else if (nuStack.isStack(call.seg)) {
                        call.seg = call.seg.clone(false);
                        // It is vitally important we do this dps
                        // assigment *after* the clone as it's
                        // possible vcpu.cs === segment. Thus
                        // doing the clone first avoids a loop.
                        call.seg.dps = dps;
                        vcpu.enterStack(call.seg, call.args);
                        return undefined;
                    } else if (typeof call.seg === 'function') {
                        // TODO this will break SEG_START and SEG_END. FIXME
                        call.args.forEach(function (item) { vcpu.cs.push(item); });
                        return call.seg.apply(this);
                    } else {
                        throw "INVALID OPERAND (EXEC)"; // TODO interrupt handler
                    }
                }},
                EXIT: {value: function () {
                    var len = vcpu.cs.length(), resultCount, removed;
                    if (len === 0) {
                        removed = [];
                    } else {
                        resultCount = vcpu.cs.pop();
                        if (typeof resultCount === 'number') {
                            len -= 1;
                            if (len < resultCount) {
                                throw "NOT ENOUGH OPERANDS (EXIT)"; // TODO interrupt handler
                            } else {
                                removed = vcpu.cs.clear(len - resultCount);
                            }
                        } else {
                            removed = [];
                        }
                    }
                    vcpu.enterStack(vcpu.cs.dps, removed);
                    return undefined;
                }},
                CALLCC: {value: function () {
                    var call = utils.prepareForCall(vcpu, "CALLCC");
                    call.args.push(vcpu.cs);

                    if (segmentTypes.isSegment(call.seg)) {
                        vcpu.enterSegment(call.seg, call.args, undefined);
                        return undefined;
                    } else if (nuStack.isStack(call.seg)) {
                        // NB we do not do the same dps
                        // modifications here as in EXEC
                        vcpu.enterStack(call.seg.clone(false), call.args);
                        return undefined;
                    } else {
                        throw "INVALID OPERAND (CALLCC)"; // TODO interrupt handler
                    }
                }}
            };
        };

    });
}(typeof define === 'function' ? define : function (factory) { module.exports = factory(); }));
