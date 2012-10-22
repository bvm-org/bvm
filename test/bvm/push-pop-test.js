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
                runCPU(['PUSH', 'hello',
                        runCPU.breakpoint(runCPU.baseStackConfigDiff(
                            {contents: ['hello']}))],
                       done);
            },

            'can push two': function (done) {
                runCPU(['PUSH', 'hello', 'PUSH', 'goodbye',
                        runCPU.breakpoint(runCPU.baseStackConfigDiff(
                            {contents: ['hello', 'goodbye']}))],
                       done);
            },

            'can push three': function (done) {
                runCPU(['PUSH', 'hello', 'PUSH', 'goodbye', 'PUSH', 7,
                        runCPU.breakpoint(runCPU.baseStackConfigDiff(
                            {contents: ['hello', 'goodbye', 7]}))],
                       done);
            },

            'can push implicit': function (done) {
                runCPU([2, 'PUSH', 'goodbye', 7,
                        runCPU.breakpoint(runCPU.baseStackConfigDiff(
                            {contents: [2, 'goodbye', 7]}))],
                       done);
            },

            'can push and pop one': function (done) {
                runCPU(['PUSH', 'hello',
                        runCPU.breakpoint(runCPU.baseStackConfigDiff({contents: ['hello']})),
                        'POP',
                        runCPU.breakpoint(runCPU.baseStackConfigDiff())],
                       done);
            },

            'can push and pop three': function (done) {
                runCPU(['PUSH', 'hello', 'PUSH', 'goodbye', 17,
                        runCPU.breakpoint(runCPU.baseStackConfigDiff(
                            {contents: ['hello', 'goodbye', 17]})),
                        'POP',
                        runCPU.breakpoint(runCPU.baseStackConfigDiff(
                            {contents: ['hello', 'goodbye']})),
                        'POP',
                        runCPU.breakpoint(runCPU.baseStackConfigDiff(
                            {contents: ['hello']})),
                        'POP',
                        runCPU.breakpoint(runCPU.baseStackConfigDiff())],
                       done);
            },

        });

    });
}(typeof define === 'function' ? define : function (factory) { module.exports = factory(); }));
