(function (define) {
    define(function () {

        'use strict';

        var bvm = require('../../index'),
            buster = require('buster'),
            breakpoint = 'BREAKPOINT',
            baseStackConfig = {dps: undefined,
                               lps: undefined,
                               lsl: 0,
                               contents: []},
            runnerBase, result;

        buster.assertions.add('stackConfiguration', {
            assert: function (stack, expectedStack) {
                ['dps', 'lps', 'lsl'].forEach(function (key) {
                    if (key in expectedStack) {
                        assert(expectedStack[key] === stack[key]);
                    }
                });
                if (expectedStack.contents) {
                    expectedStack.contents.forEach(function (value, idx) {
                        assert(value === stack.index(idx));
                    });
                    assert(expectedStack.contents.length === stack.length());
                }
                return true;
            },
            assertMessage: 'Expected stack(${0}) to match ${1}',
            refuteMessage: 'Expected stack(${0}) to not match ${1}',
            expectation: 'toBeStackMatching'
        });

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

        return result;
    });
}(typeof define === 'function' ? define : function (factory) { module.exports = factory(); }));
