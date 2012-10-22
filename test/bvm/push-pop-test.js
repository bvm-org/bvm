(function (define) {
    define(function () {

        'use strict';

        var buster = require('buster'),
            fail = buster.assertions.fail,
            assert = buster.assertions.assert,
            refute = buster.assertions.refute,
            runCPU = require('./runCPU');

        buster.testRunner.timeout = 10000; // 10 seconds

        buster.testCase('push-pop', {

            'can push one': function (done) {
                runCPU(['PUSH', 'hello', 'TESTCASE'],
                       [{contents: ['hello'],
                         dps: undefined,
                         lps: undefined,
                         lsl: 0}], done);
            },

            'can push two': function (done) {
                runCPU(['PUSH', 'hello', 'PUSH', 'goodbye', 'TESTCASE'],
                       [{contents: ['hello', 'goodbye'],
                         dps: undefined,
                         lps: undefined,
                         lsl: 0}], done);
            },

            'can push three': function (done) {
                runCPU(['PUSH', 'hello', 'PUSH', 'goodbye', 'PUSH', 7, 'TESTCASE'],
                       [{contents: ['hello', 'goodbye', 7],
                         dps: undefined,
                         lps: undefined,
                         lsl: 0}], done);
            },

            'can push implicit': function (done) {
                runCPU([2, 'PUSH', 'goodbye', 7, 'TESTCASE'],
                       [{contents: [2, 'goodbye', 7],
                         dps: undefined,
                         lps: undefined,
                         lsl: 0}], done);
            },

            'can push and pop one': function (done) {
                var configurations = [
                    {contents: ['hello'],
                     dps: undefined,
                     lps: undefined,
                     lsl: 0},
                    {contents: [],
                     dps: undefined,
                     lps: undefined,
                     lsl: 0}
                ];
                runCPU(['PUSH', 'hello', 'TESTCASE', 'POP', 'TESTCASE'],
                       configurations, done);
            },

            'can push and pop three': function (done) {
                var configurations = [
                    {contents: ['hello', 'goodbye', 17],
                     dps: undefined,
                     lps: undefined,
                     lsl: 0},
                    {contents: ['hello', 'goodbye'],
                     dps: undefined,
                     lps: undefined,
                     lsl: 0},
                    {contents: ['hello'],
                     dps: undefined,
                     lps: undefined,
                     lsl: 0},
                    {contents: [],
                     dps: undefined,
                     lps: undefined,
                     lsl: 0}
                ];
                runCPU(['PUSH', 'hello', 'PUSH', 'goodbye', 17, 'TESTCASE',
                        'POP', 'TESTCASE',
                        'POP', 'TESTCASE',
                        'POP', 'TESTCASE'], configurations, done);
            },

        });

    });
}(typeof define === 'function' ? define : function (factory) { module.exports = factory(); }));
