(function (define) {
    define(function () {

        'use strict';

        var types = require('../types'),
            nuArray = require('../array'),
            nuDict = require('../dict'),
            nuStack = require('../stack'),
            nuSegment = require('../segment'),
            nuError = require('../errors');

        return function (vcpu) {

            var binaryCmpNumStr = function () {
                var a, b, aType, bType;
                if (vcpu.cs.length() > 1) {
                    b = vcpu.cs.pop();
                    a = vcpu.cs.pop();
                    aType = typeof a;
                    bType = typeof b;
                    if (aType === bType) {
                        if (aType === 'number' || aType === 'boolean' ||
                            (a === types.mark  && b === types.mark) ||
                            (a === types.undef && b === types.undef)) {
                            vcpu.cs.push(this.fun(a, b));
                            return;
                        } else if (types.isChar(a) && types.isChar(b)) {
                            vcpu.cs.push(this.fun(a.ch, b.ch));
                            return;
                        } else {
                            nuError.invalidOperand(a, b);
                        }
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
                                (a === types.mark && b === types.mark) ||
                                (a === types.undef && b === types.undef)) {
                                vcpu.cs.push(a === b);
                                return;
                            } else if (types.isChar(a) && types.isChar(b)) {
                                vcpu.cs.push(a.ch === b.ch);
                                return;
                            } else if (types.isLexicalAddress(a) && types.isLexicalAddress(b)) {
                                vcpu.cs.push(a.ls === b.ls && a.index === b.index);
                                return;
                            } else if ((nuArray.isArray(a)      && nuArray.isArray(b)     ) ||
                                       (nuDict.isDict(a)        && nuDict.isDict(b)       ) ||
                                       (nuSegment.isSegment(a)  && nuSegment.isSegment(b) ) ||
                                       (nuStack.isStack(a)      && nuSegment.isStack(b)   ) ||
                                       (typeof a === 'function' && typeof b === 'function')) {
                                vcpu.cs.push(a === b);
                                return;
                            } else {
                                vcpu.cs.push(false);
                                return;
                            }
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
