(function (define) {
    define(function () {

        'use strict';

        var types = require('../types'),
            nuArray = require('../array'),
            nuDict = require('../dict'),
            nuStack = require('../stack'),
            segmentTypes = require('../segment');

        return function (vcpu) {

            var binaryCmpNumStr = function (fun, opStr) {
                var a, b;
                if (vcpu.cs.length() > 1) {
                    b = vcpu.cs.pop();
                    a = vcpu.cs.pop();
                    if ((typeof a === 'number' && typeof b === 'number') ||
                        (types.isString(a) && types.isString(b))) {
                        vcpu.cs.push(fun(a, b));
                        return;
                    } else {
                        throw "INVALID OPERAND (" + opStr + ")"; // TODO interrupt handler
                    }
                } else {
                    throw "NOT ENOUGH OPERANDS (" + opStr + ")"; // TODO interrupt handler
                }
            },
            lt = function (a, b) { return a < b; },
            lte = function (a, b) { return a <= b; },
            gt = function (a, b) { return a > b; },
            gte = function (a, b) { return a >= b; };

            return {
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
                                throw "INTERNAL ERROR (EQ)"; // TODO interrupt handler
                            }
                        } else if (types.isString(a) && types.isString(b)) {
                            // this will convert both to the primitive repr.
                            vcpu.cs.push(('' + a) === ('' + b));
                        } else {
                            vcpu.cs.push(false);
                            return;
                        }
                    } else {
                        throw "NOT ENOUGH OPERANDS (EQ)"; // TODO interrupt handler
                    }
                },
                NEQ: function () {
                    this.EQ();
                    vcpu.cs.push(! vcpu.cs.pop());
                    return;
                },
                LT:  function () { return binaryCmpNumStr(lt,  'LT' ); },
                LTE: function () { return binaryCmpNumStr(lte, 'LTE'); },
                GT:  function () { return binaryCmpNumStr(gt,  'GT' ); },
                GTE: function () { return binaryCmpNumStr(gte, 'GTE'); }
            };
        };

    });
}(typeof define === 'function' ? define : function (factory) { module.exports = factory(); }));
