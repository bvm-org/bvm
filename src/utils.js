(function (define) {
    define(function () {

        'use strict';

        var types = require('./types'),
            segmentTypes = require('./segment'),
            nuStack = require('./stack'),
            nuError = require('./errors'),
            undef;

        return Object.defineProperties(
            {},
            {
                prepareForCall: {value: function (vcpu) {
                    var len = vcpu.cs.length(), arity, removed, segment;
                    if (len > 0) {
                        arity = vcpu.cs.pop();
                        len -= 1;
                        if (typeof arity === 'number') {
                            if (len < (arity+1) || arity < 0) {
                                nuError.notEnoughOperands();
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

                        return {seg: segment, args: removed};
                    } else {
                        nuError.notEnoughOperands()
                    }
                }},

                detectTailCall: {value: function (vcpu) {
                    return vcpu.cs.ip.isExhausted() ? vcpu.cs.dps : vcpu.cs;
                }},

                isExecutable: {value: function (thing) {
                    return segmentTypes.isSegment(thing) ||
                        nuStack.isStack(thing) ||
                        typeof thing === 'function';
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
                }},
            });

    });
}(typeof define === 'function' ? define : function (factory) { module.exports = factory(); }));
