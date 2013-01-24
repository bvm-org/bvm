(function (define) {
    define(function () {

        'use strict';

        var bvm = require('../../bvm'),
            types = bvm.types,
            buster = require('buster'),
            fail = buster.assertions.fail,
            assert = buster.assertions.assert,
            refute = buster.assertions.refute,
            nuArray = require('../../src/array'),
            nuDict = require('../../src/dict'),
            nuStack = require('../../src/stack'),
            nuSegment = require('../../src/segment'),
            breakpointBase = 'BREAKPOINT',
            undef,
            baseStackConfig = {dps: undef,
                               lps: undef,
                               lsl: 0,
                               contents: []},
            runnerBase, result, comparator;

        buster.testRunner.timeout = 2000; // 2 seconds

        buster.assertions.add('stackConfiguration', {
            assert: function (stack, expectedStack, vcpu, ops) {
                if (expectedStack.pre) {
                    expectedStack.pre(stack, expectedStack);
                }
                ['dps', 'lps', 'lsl'].forEach(function (key) {
                    if (key in expectedStack) {
                        assert(expectedStack[key] === stack[key], key);
                    }
                });
                if (expectedStack.contents) {
                    expectedStack.contents.forEach(function (value, idx) {
                        comparator(value, stack.index(idx), vcpu, ops);
                    });
                    assert(expectedStack.contents.length === stack.length());
                }
                if (expectedStack.post) {
                    expectedStack.post(stack, expectedStack);
                }
                return true;
            },
            assertMessage: 'Expected stack(${0}) to match ${1}',
            refuteMessage: 'Expected stack(${0}) to not match ${1}',
            expectation: 'toBeStackMatching'
        });

        comparator = function (test, found, vcpu, ops) {
            if (typeof test === 'boolean' ||
                typeof test === 'number' ||
                test === types.mark ||
                test === types.undef ||
                test === undef) {
                if (typeof found === 'function') {
                    assert(test in ops && ops[test] === found, test);
                } else {
                    assert(test === found, test);
                }
            } else if (types.isRawString(test)) {
                if (typeof found === 'function') {
                    assert(test in ops && ops[test] === found, test);
                } else if (nuArray.isArray(found)) {
                    assert(found.allChars, test);
                    assert(('' + test) === found.toRawString(), test);
                } else {
                    assert(types.isRawString(found), test);
                    assert(('' + test) === ('' + found), test);
                }
            } else if (Array.isArray(test)) {
                assert(nuArray.isArray(found));
                assert(test.length === found.length());
                test.forEach(function (value, idx) {
                    comparator(value, found.index(idx), vcpu, ops);
                });
            } else if (typeof test === 'object' && 'type' in test) {
                if (test.type === 'dict') {
                    assert(nuDict.isDict(found));
                    if ('contents' in test) {
                        assert(Object.keys(test.contents).length === found.keys().length);
                        Object.keys(test.contents).forEach(function (key) {
                            comparator(test.contents[key], found.load(key), vcpu, ops);
                        });
                    }
                } else if (test.type === 'seg') {
                    assert(nuSegment.isSegment(found));
                    if ('contents' in test) {
                        assert(test.contents.length === found.length());
                        test.contents.forEach(function (op, idx) {
                            comparator(op, found.index(idx), vcpu, ops);
                        });
                    }
                } else if (test.type === 'ptr') {
                    assert(types.isPointer(found));
                    if ('target' in test) {
                        comparator(test.target, found.target, vcpu, ops);
                    }
                } else if (test.type === 'lexical') {
                    assert(types.isLexicalAddress(found));
                    assert(test.lsl === found.lsl);
                    assert(test.index === found.index);
                } else if (test.type === 'stack') {
                    assert(nuStack.isStack(found));
                    if ('contents' in test) {
                        assert(test.contents.length === found.length());
                        test.contents.forEach(function (op, idx) {
                            comparator(op, found.index(idx), vcpu, ops);
                        });
                    }
                    if ('lsl' in test) {
                        assert(test.lsl === found.lsl);
                    }
                } else if (test.type === 'character') {
                    assert(types.isChar(found));
                    if ('contents' in test) {
                        assert(test.contents === found.ch);
                    }
                } else {
                    throw 'Non-understood type to compare in contents: ' + test;
                }
            } else if (test === result.breakpoint) {
                assert(types.isRawString(found) &&
                       found.substr(0, breakpointBase.length) === breakpointBase);
            } else {
                throw 'Non-understood type to compare in contents: ' + test;
            }
        };

        runnerBase = {
            run: function () {
                var cpu = bvm.nuCPU(bvm.nuSegment(this.code)),
                    breakpoints = this.breakpoints,
                    unreachables = this.unreachables;
                Object.keys(breakpoints).forEach(function (breakpoint) {
                    cpu.installOp(
                        breakpoint,
                        function (vcpu, ops) {
                            assert.stackConfiguration(vcpu.cs, breakpoints[breakpoint],
                                                      vcpu, ops);
                            breakpoints[breakpoint].reached = true;
                        });
                });
                Object.keys(unreachables).forEach(function (unreachable) {
                    cpu.installOp(
                        unreachable,
                        function (vcpu, ops) { fail(unreachables[unreachable]); });
                });
                cpu.boot();
                Object.keys(breakpoints).forEach(function (breakpoint) {
                    assert('reached' in breakpoints[breakpoint]);
                });
                return cpu.result;
            },
            setCode: function (code) {
                this.code = code;
                return this;
            },
            addBreakPoint: function (config) {
                var breakpoint = breakpointBase + this.breakpointCount;
                this.breakpoints[breakpoint] = config;
                this.breakpointCount += 1;
                return breakpoint;
            },
            addUnreachablePoint: function (msg) {
                var unreachablepoint = breakpointBase + '-' + this.unreachableCount;
                this.unreachables[unreachablepoint] = msg || ('' + unreachablepoint);
                this.unreachableCount += 1;
                return unreachablepoint;
            }
        };

        result = function () {
            return Object.create(
                runnerBase,
                {
                    breakpointCount: {value: 0, writable: true},
                    breakpoints: {value: {}},
                    unreachableCount: {value: 0, writable: true},
                    unreachables: {value: {}},
                });
        };

        result.baseStackConfigDiff = function (diff) {
            var obj = Object.create(baseStackConfig);
            if (diff) {
                Object.keys(diff).forEach(function (key) {
                    obj[key] = diff[key];
                });
            }
            return obj;
        };
        result.types = types;
        result.breakpoint = {};

        return result;
    });
}(typeof define === 'function' ? define : function (factory) { module.exports = factory(); }));
