(function (define) {
    define(function () {

        'use strict';

        var bvm = require('../../index'),
            buster = require('buster');

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

        return function runCPU(code, testcaseCallback, done) {
            try {
                var cpu = bvm.bvm(bvm.segmentTypes.json(code));
                if (testcaseCallback) {
                    cpu.installOp('TESTCASE', Array.isArray(testcaseCallback) ?
                                  function (vcpu, ops) {
                                      assert.stackConfiguration(vcpu.cs, testcaseCallback.shift());
                                      if (! testcaseCallback.length) { done(); }
                                  } :
                                  function (vcpu, ops) {
                                      testcaseCallback(vcpu, ops);
                                  });
                }
                cpu.boot();
                return undefined;
            } catch (e) {
                return e;
            }
        };

    });
}(typeof define === 'function' ? define : function (factory) { module.exports = factory(); }));
