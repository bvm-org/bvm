(function (define) {
    define(function () {

        'use strict';

        var segmentTypes = require('../segment'),
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
                            if (types.isPointer(segment)) {
                                segment = segment.transitiveDereference();
                            } else if (types.isAddressCouplet(segment)) {
                                segment = vcpu.dereferenceScope(segment.lsl).copy(segment.index);
                            }

                            if (segmentTypes.isSegment(segment)) {
                                if (len < segment.arity) {
                                    throw "INVALID OPERAND (EXEC)"; // TODO interrupt handler
                                } else {
                                    removed = vcpu.cs.clear(len - segment.arity);
                                    vcpu.enter(segment, removed);
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
                                vcpu.exit(removed);
                                return undefined;
                            }
                        }
                    }},
                });
            return undefined;
        };

    });
}(typeof define === 'function' ? define : function (factory) { module.exports = factory(); }));
