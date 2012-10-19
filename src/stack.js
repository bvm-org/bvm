(function (define) {
    define(function () {

        'use strict';

        var types = require('./types');

        return function nuVCPU () {
            var vcpu, ops;
            vcpu = adornRegistersAndHelpers();
            ops = adornOps(vcpu);
            return function (segment, index) {
                var op;
                vcpu.cs = nuStack(undefined, undefined, segment, index);
                vcpu.lsps[0] = vcpu.cs;
                vcpu.lsps.length = 1;
                while (true) {
                    op = vcpu.cs.ip.fetch();
                    if (op === 'SEG_END') {
                        vcpu.deferred -= 1;
                    } else if (op === 'SEG_START') {
                        vcpu.deferred += 1;
                    }
                    if (vcpu.deferred > 0) {
                        ops.PUSH(op);
                    } else {
                        if (ops[op.name]) {
                            ops[op.name].apply(ops, op.immediateArgs);
                        } else {
                            ops['UNKNOWN'](op);
                        }
                    }
                }
            };
        };

        function adornRegistersAndHelpers () {
            return Object.create(
                {},
                {
                    deferred: {value: 0, writable: true},
                    lsps: {value: []},
                    cd: {value: nuDict(), writable: true},
                    cs: {value: undefined, writable: true},
                    dereferenceScope: {value: function (ls) {
                        return lsps[lsps.length - ls - 1];
                    }},
                    enter: {value: function (segment) {
                        var stack = nuStack([], this.cs, segment, 0),
                            idx;
                        this.lsps.length = 1 + stack.lsl;
                        this.lsps[stack.lsl] = stack;
                        for (idx = stack.lsl - 1; idx >= 0; idx -= 1) {
                            this.lsps[idx] = this.lsps[idx + 1].lps;
                        }
                        this.cs = stack;
                    }}
                });
        }

        // TODO: these entries actually need pushing into some sort of
        // a prelude dict. No, not true - that would probably require
        // that these ops be implemented non-native.
        function adornOps (vcpu) {
            return Object.create(
                {},
                {
                    PUSH: {value: function (literal) {
                        vcpu.cs.push(literal);
                        return undefined;
                    }},
                    POP: {value: function () {
                        if (vcpu.cs.length() > 0) {
                            return vcpu.cs.pop();
                        } else {
                            throw "NOT ENOUGH OPERANDS (POP)"; // TODO interrupt handler
                        }
                    }},
                    DUPLICATE: {value: function () {
                        var len = vcpu.cs.length();
                        if (len > 0) {
                            vcpu.cs.push(vcpu.cs.index(len - 1));
                            return undefined;
                        } else {
                            throw "NOT ENOUGH OPERANDS (DUPLICATE)"; // TODO interrupt handler
                        }
                    }},
                    EXCHANGE: {value: function () {
                        var len = vcpu.cs.length(), tmp;
                        if (len > 1) {
                            len -= 1;
                            tmp = vcpu.cs.index(len);
                            vcpu.cs.store(len, vcpu.cs.index(len - 1));
                            vcpu.cs.store(len - 1, tmp);
                            return undefined;
                        } else {
                            throw "NOT ENOUGH OPERANDS (EXCHANGE)"; // TODO interrupt handler
                        }
                    }},
                    COUNT: {value: function () {
                        vcpu.cs.push(vcpu.cs.length());
                        return undefined;
                    }},
                    // TODO: COPY, ROLL, INDEX

                    LOAD: {value: function () {
                        var reference;
                        if (vcpu.cs.length() > 0) {
                            reference = vcpu.cs.pop();
                            if (isAddressCouplet(reference)) {
                                vcpu.cs.push(vcpu.dereferenceScope(reference.lsl).index(reference.index));
                                return undefined;
                            } else if (isAtomString(reference)) {
                                if (vcpu.cd.has(reference)) {
                                    vcpu.cs.push(vcpu.cd.load(reference));
                                } else {
                                    vcpu.cs.push(types.undef);
                                }
                                return undefined;
                            } else {
                                throw "INVALID OPERAND (LOAD)"; // TODO interrupt handler
                            }
                        } else {
                            throw "NOT ENOUGH OPERANDS (LOAD)"; // TODO interrupt handler
                        }
                    }},
                    STORE: {value: function () {
                        var value, reference;
                        if (vcpu.cs.length() > 1) {
                            value = vcpu.cs.pop();
                            reference = vcpu.cs.pop();
                            if (isAddressCouplet(reference)) {
                                vcpu.dereferenceScope(reference.lsl).store(reference.index, value);
                                return undefined;
                            } else if (isAtomString(reference)) {
                                vcpu.cd.store(reference, value);
                                return undefined;
                            } else {
                                throw "INVALID OPERAND (STORE)"; // TODO interrupt handler
                            }
                        } else {
                            throw "NOT ENOUGH OPERANDS (STORE)"; // TODO interrupt handler
                        }
                    }},

                    MARK: {value: function () {
                        vcpu.cs.push(types.mark);
                        return undefined;
                    }},
                    COUNT_TO_MARK: {value: function () {
                        var len = vcpu.cs.length(), mark = vcpu.cs.lastIndexOf(types.mark);
                        if (mark === -1) {
                            throw "INVALID OPERAND (COUNT_TO_MARK)"; // TODO interrupt handler
                        } else {
                            vcpu.cs.push((len - mark) - 1);
                            return undefined;
                        }
                    }},
                    CLEAR_TO_MARK: {value: function () {
                        var mark = vcpu.cs.lastIndexOf(types.mark);
                        if (mark === -1) {
                            throw "INVALID OPERAND (CLEAR_TO_MARK)"; // TODO interrupt handler
                        } else {
                            vcpu.cs.clear(mark);
                            return undefined;
                        }
                    }},
                    ARRAY_START: {value: function () {
                        this.MARK();
                        return undefined;
                    }},
                    ARRAY_END: {value: function () {
                        var len = vcpu.cs.length(), mark = vcpu.cs.lastIndexOf(types.mark),
                            removed;
                        if (mark === -1) {
                            throw "INVALID OPERAND (ARRAY_END)"; // TODO interrupt handler
                        } else {
                            removed = vcpu.cs.clear((len - mark) - 1);
                            removed.shift(); // drop the initial mark
                            vcpu.cs.push(nuArray(removed));
                            return undefined;
                        }
                    }},
                    DICT_START: {value: function () {
                        this.MARK();
                        return undefined;
                    }},
                    DICT_END: {value: function () {
                        var len = vcpu.cs.length(), mark = vcpu.cs.lastIndexOf(types.mark),
                            dict = {}, removed, idx, key, val;
                        if (mark === -1) {
                            throw "INVALID OPERAND (DICT_END)"; // TODO interrupt handler
                        } else {
                            removed = vcpu.cs.clear((len - mark) - 1);
                            removed.shift(); // drop the initial mark
                            if (removed.length % 2 !== 0) {
                                throw "INVALID OPERAND (DICT_END)"; // TODO interrupt handler
                            } else {
                                for (idx = 0; idx < removed.length; idx += 2) {
                                    key = removed[idx];
                                    val = removed[idx + 1];
                                    dict[key] = val;
                                }
                                vcpu.cs.push(nuDict(dict));
                                return undefined;
                            }
                        }
                    }},
                    SEG_START: {value: function () {
                        this.MARK();
                        return undefined;
                    }},
                    SEG_END: {value: function () {
                        var len = vcpu.cs.length(), mark = vcpu.cs.lastIndexOf(types.mark),
                            removed;
                        if (mark === -1) {
                            throw "INVALID OPERAND (SEG_END)"; // TODO interrupt handler
                        } else {
                            removed = vcpu.cs.clear((len - mark) - 1);
                            removed.shift(); // drop the initial mark
                            vcpu.cs.push(nuSegment(removed, vcpu.cs));
                            return undefined;
                        }
                    }},
                    UNKNOWN: {value: function (op) {
                        var thing;
                        if (isAddressCouplet(op)) {
                            thing = vcpu.dereferenceScope(op.lsl);
                        } else if (isAtomString(op)) {
                            thing = vcpu.cd.load(op);
                        } else {
                            vcpu.cs.push(op);
                            return undefined;
                        }
                        if (isSegment(thing)) {
                            vcpu.enter(thing);
                        } else {
                            vcpu.cs.push(thing);
                        }
                        return undefined;
                    }}
                });
        }

        function nuIP (segment, index) {
            if (! index) {
                index = 0;
            }
            var ip = Object.create(
                {},
                {
                    segment: {value: segment},
                    index: {value: index, writable: true}
                });
            return adornIPHelpers(ip);
        }

        function adornIPHelpers (ip) {
            return Object.create(
                {},
                {
                    fetch: {value: function () {
                        var op;
                        if (ip.index >= ip.segment.length()) {
                            throw "HALT: EXHAUSTED SEGMENT";
                        } else {
                            op = ip.segment.index(ip.index);
                            ip.index += 1;
                            return op;
                        }
                    }}
                });
        }

        function nuSegment (array, stack) {
            array = nuArray(array);
            return adornSegmentFields(array, stack);
        }

        function adornSegmentFields (segment, stack) {
            return Object.create(
                segment,
                {
                    ls: {value: stack}
                });
        }

        // segment here is the new segment being entered.
        function nuStack (stackBase, oldStack, segment, index) {
            var stack = adornStackHeader(nuArray(stackBase));
            if (oldStack) {
                stack.dps = oldStack;
            }
            if (segment) {
                stack.lsp = segment.ls;
                stack.lsl = segment.ls.lsl + 1;
                stack.ip = nuIP(segment, index);
            }
            return stack;
        }

        function adornStackHeader (stack) {
            return Object.create(
                stack,
                {
                    dps: {value: undefined,
                          writable: true},
                    lps: {value: undefined,
                          writable: true},
                    lsl: {value: 0,
                          writable: true},
                    ip: {value: undefined,
                         writable: true}
                });
        }

        function isSegment (thing) {
            return 'dps' in thing &&
                'lps' in thing &&
                'lsl' in thing;
        }

        function nuArray (array) {
            if (! array) {
                array = [];
            }
            return adornArrayOps(array);
        }

        function adornArrayOps (array) {
            return Object.create(
                {},
                {
                    push: {value: array.push.bind(array)},
                    pop: {value: array.pop.bind(array)},
                    length: {value: function () {
                        return array.length;
                    }},
                    index: {value: function (idx) {
                        return array[idx];
                    }},
                    store: {value: function (idx, val) {
                        array[idx] = val;
                        return undefined;
                    }},
                    clear: {value: function (from) {
                        if (! from) {
                            from = 0;
                        }
                        return array.splice(from, array.length - from);
                    }},
                    lastIndexOf: {value: array.lastIndexOf.bind(array)}
                });
        }

        function nuDict (dict) {
            if (! dict) {
                dict = {};
            }
            dict = adornDictOps(dict);
            return dict;
        }

        function adornDictOps (dict) {
            return Object.create(
                {},
                {
                    has: {value: function (key) {
                        return dict.hasOwnProperty(key);
                    }},
                    load: {value: function (key) {
                        if (dict.hasOwnProperty(key)) {
                            return dict[key];
                        } else {
                            return undefined;
                        }
                    }},
                    store: {value: function (key, value) {
                        if (value === undefined && value === null) {
                            delete dict[key];
                        } else {
                            dict[key] = value;
                        }
                        return undefined;
                    }},
                    remove: {value: function (key) {
                        delete dict[key];
                        return undefined;
                    }}
                });
        }

        function isAtomString (thing) {
            return typeof thing === 'string';
        }

        function isAddressCouplet (thing) {
            return typeof thing === 'object' &&
                'lsl' in thing &&
                'index' in thing;
        }

    });
}(typeof define === 'function' ? define : function (factory) { module.exports = factory(); }));
