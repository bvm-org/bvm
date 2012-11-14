(function (define) {
    define(function () {

        'use strict';

        var types = require('../types'),
            nuArray = require('../array'),
            nuDict = require('../dict'),
            nuStack = require('../stack'),
            segmentTypes = require('../segment'),
            nuError = require('../errors');

        return function (vcpu) {

            var binaryCmpNumStr = function () {
                var a, b;
                if (vcpu.cs.length() > 1) {
                    b = vcpu.cs.pop();
                    a = vcpu.cs.pop();
                    if ((typeof a === 'number' && typeof b === 'number') ||
                        (types.isString(a) && types.isString(b))) {
                        vcpu.cs.push(this.fun(a, b));
                        return;
                    } else {
                        nuError.invalidOperand(a, b);
                    }
                } else {
                    nuError.notEnoughOperands();
                }
            },
            lt  = {fun: function (a, b) { return a < b;  }, name: 'LT' },
            lte = {fun: function (a, b) { return a <= b; }, name: 'LTE'},
            gt  = {fun: function (a, b) { return a > b;  }, name: 'GT' },
            gte = {fun: function (a, b) { return a >= b; }, name: 'GTE'},
            result;

            result = {
                EQ: function () {
                    var a, b, aType, bType;
                    if (vcpu.cs.length() > 1) {
                        b = vcpu.cs.pop();
                        a = vcpu.cs.pop();
                        aType = typeof a;
                        bType = typeof b;
                        if (aType === bType) {
                            if (aType === 'number' ||
                                aType === 'boolean' ||
                                aType === 'string' ||
                                a === types.mark ||
                                a === types.undef) {
                                vcpu.cs.push(a === b);
                                return;
                            } else if (types.isLexicalAddress(a)) {
                                vcpu.cs.push(types.isLexicalAddress(b) &&
                                             a.lsl === b.lsl && a.index === b.index);
                                return;
                            } else if (nuArray.isArray(a) || nuDict.isDict(a) ||
                                       segmentTypes.isSegment(a) || nuStack.isStack(a) ||
                                       typeof a === 'function') {
                                vcpu.cs.push(a === b);
                                return;
                            } else {
                                nuError.internalError();
                            }
                        } else if (types.isString(a) && types.isString(b)) {
                            // this will convert both to the primitive repr.
                            vcpu.cs.push(('' + a) === ('' + b));
                        } else {
                            vcpu.cs.push(false);
                            return;
                        }
                    } else {
                        nuError.notEnoughOperands();
                    }
                },
                NEQ: function () {
                    this.EQ();
                    vcpu.cs.push(! vcpu.cs.pop());
                    return;
                }
            };

            [lt, lte, gt, gte].forEach(
                function (binFun) { result[binFun.name] = binaryCmpNumStr.bind(binFun); });

            return result;
        };

    });
}(typeof define === 'function' ? define : function (factory) { module.exports = factory(); }));
