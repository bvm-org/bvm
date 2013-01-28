(function (define) {
    define(function () {

        'use strict';

        var types = require('./types'),
            nuSegment = require('./segment'),
            nuStack = require('./stack'),
            nuError = require('./errors'),
            nuArray = require('./array'),
            cycleError = function (address) {
                nuError(address, 'ERROR CYCLICAL LEXICAL ADDRESSES');
                return cycleError;
            },
            undef;

        return Object.defineProperties(
            {},
            {
                callPrepareError: {value: cycleError},

                prepareForCall: {value: function (vcpu) {
                    var segment;
                    if (vcpu.cs.length() > 0) {
                        segment = vcpu.cs.pop();

                        if (types.isLexicalAddress(segment)) {
                            segment = segment.transitiveDereference(vcpu, cycleError);
                        }

                        return segment;
                    } else {
                        nuError.notEnoughOperands();
                    }
                }},

                detectTailCall: {value: function (vcpu) {
                    return vcpu.cs.ip.isExhausted() ? vcpu.cs.dps : vcpu.cs;
                }},

                searchDicts: {value: function (obj) {
                    var key = obj.key, dicts = obj.dicts, idx = dicts.length() - 1,
                        dict;
                    obj.found = undef;
                    obj.dict = undef;
                    for (; idx >= 0; idx -= 1) {
                        dict = dicts.index(idx);
                        if (dict.has(key)) {
                            obj.found = dict.load(key);
                            obj.dict = dict;
                            break;
                        }
                    }
                    return obj;
                }}
            });

    });
}(typeof define === 'function' ? define : function (factory) { module.exports = factory(); }));
