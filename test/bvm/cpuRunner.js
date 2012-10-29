(function (define) {
    define(function () {

        'use strict';

        var bvm = require('../../index'),
            buster = require('buster'),
            types = require('../../src/types'),
            nuArray = require('../../src/array'),
            nuDict = require('../../src/dict'),
            breakpoint = 'BREAKPOINT',
            baseStackConfig = {dps: undefined,
                               lps: undefined,
                               lsl: 0,
                               contents: []},
            runnerBase, result, comparator;

        buster.assertions.add('stackConfiguration', {
            assert: function (stack, expectedStack) {
                if (expectedStack.pre) {
                    expectedStack.pre(stack, expectedStack);
                }
                ['dps', 'lps', 'lsl'].forEach(function (key) {
                    if (key in expectedStack) {
                        assert(expectedStack[key] === stack[key]);
                    }
                });
                if (expectedStack.contents) {
                    expectedStack.contents.forEach(function (value, idx) {
                        comparator(value, stack.index(idx));
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

        comparator = function (test, found) {
            if (typeof test === 'string' ||
                typeof test === 'boolean' ||
                typeof test === 'number' ||
                test === types.mark ||
                test === types.undef ||
                test === undefined) {
                assert(test === found);
            } else if (Array.isArray(test)) {
                assert(nuArray.isArray(found));
                test.forEach(function (value, idx) {
                    comparator(value, found.index(idx));
                });
            } else if (typeof test === 'object' && 'type' in test) {
                if (test.type === 'dict') {
                    assert(nuDict.isDict(found));
                    Object.keys(test).forEach(function (key) {
                        comparator(test[key], found.load(key));
                    });
                } else if (test.type === 'ptr') {
                    assert(types.isPointer(found));
                    if ('target' in test) {
                        comparator(test.target, found.target);
                    }
                } else {
                    throw 'Non-understood type to compare in contents: ' + test;
                }
            } else {
                throw 'Non-understood type to compare in contents: ' + test;
            }
        };

        runnerBase = {
            run: function () {
                try {
                    var cpu = bvm.bvm(bvm.segmentTypes.json(this.code));
                    if (this.breakpoints.length !== 0) {
                        cpu.installOp(
                            breakpoint,
                            function (vcpu, ops) {
                                assert.stackConfiguration(vcpu.cs, this.breakpoints.shift());
                                if (! this.breakpoints.length) { this.done(); }
                            }.bind(this));
                    }
                    cpu.boot();
                    return undefined;
                } catch (e) {
                    return e;
                }
            },
            setCode: function (code) {
                this.code = code;
                return this;
            },
            addBreakPoint: function (config) {
                this.breakpoints.push(config);
                return breakpoint;
            }
        };

        result = function (done) {
            return Object.create(
                runnerBase,
                {
                    breakpoints: {value: []},
                    done: {value: done}
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

        return result;
    });
}(typeof define === 'function' ? define : function (factory) { module.exports = factory(); }));
