(function (define) {
    define(function () {

        'use strict';

        var bvm = require('../../index'),
            buster = require('buster'),
            breakpoint = 'BREAKPOINT', configurations = [],
            baseStackConfig = {dps: undefined,
                               lps: undefined,
                               lsl: 0,
                               contents: []},
            runCPU;

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

        runCPU = function runCPU(code, done) {
            var configs = configurations.splice(0);
            try {
                var cpu = bvm.bvm(bvm.segmentTypes.json(code));
                if (configs.length !== 0) {
                    cpu.installOp(breakpoint,
                                  function (vcpu, ops) {
                                      assert.stackConfiguration(vcpu.cs, configs.shift());
                                      if (! configs.length) { done(); }
                                  });
                }
                cpu.boot();
                return undefined;
            } catch (e) {
                return e;
            }
        };
        runCPU.breakpoint = function (config) {
            configurations.push(config);
            return breakpoint;
        };
        runCPU.baseStackConfigDiff = function (diff) {
            var obj = Object.create(baseStackConfig);
            if (diff) {
                Object.keys(diff).forEach(function (key) {
                    obj[key] = diff[key];
                });
            }
            return obj;
        };

        return runCPU;

    });
}(typeof define === 'function' ? define : function (factory) { module.exports = factory(); }));
