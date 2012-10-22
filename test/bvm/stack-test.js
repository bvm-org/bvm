(function (define) {
    define(function () {

        'use strict';

        var buster = require('buster'),
            fail = buster.assertions.fail,
            assert = buster.assertions.assert,
            refute = buster.assertions.refute,
            runner = require('./cpuRunner');

        buster.testRunner.timeout = 10000; // 10 seconds

        buster.testCase('basic stack ops', {

            'can push one': function (done) {
                var cpu = runner(done);
                cpu.setCode(['PUSH', 'hello',
                             cpu.addBreakPoint(runner.baseStackConfigDiff(
                                 {contents: ['hello']}))]).run();
            },

            'can push two': function (done) {
                var cpu = runner(done);
                cpu.setCode(['PUSH', 'hello', 'PUSH', 'goodbye',
                             cpu.addBreakPoint(runner.baseStackConfigDiff(
                                 {contents: ['hello', 'goodbye']}))]).run();
            },

            'can push three': function (done) {
                var cpu = runner(done);
                cpu.setCode(['PUSH', 'hello', 'PUSH', 'goodbye', 'PUSH', 7,
                             cpu.addBreakPoint(runner.baseStackConfigDiff(
                                 {contents: ['hello', 'goodbye', 7]}))]).run();
            },

            'can push implicit': function (done) {
                var cpu = runner(done);
                cpu.setCode([2, 'PUSH', 'goodbye', 7,
                             cpu.addBreakPoint(runner.baseStackConfigDiff(
                                 {contents: [2, 'goodbye', 7]}))]).run();
            },

            'can push and pop one': function (done) {
                var cpu = runner(done);
                cpu.setCode(['PUSH', 'hello',
                             cpu.addBreakPoint(runner.baseStackConfigDiff({contents: ['hello']})),
                             'POP',
                             cpu.addBreakPoint(runner.baseStackConfigDiff())]).run();
            },

            'can push and pop three': function (done) {
                var cpu = runner(done);
                cpu.setCode(['PUSH', 'hello', 'PUSH', 'goodbye', 17,
                             cpu.addBreakPoint(runner.baseStackConfigDiff(
                                 {contents: ['hello', 'goodbye', 17]})),
                             'POP',
                             cpu.addBreakPoint(runner.baseStackConfigDiff(
                                 {contents: ['hello', 'goodbye']})),
                             'POP',
                             cpu.addBreakPoint(runner.baseStackConfigDiff(
                                 {contents: ['hello']})),
                             'POP',
                             cpu.addBreakPoint(runner.baseStackConfigDiff())]).run();
            },

            'duplicate': function (done) {
                var cpu = runner(done);
                cpu.setCode([3, 8,
                             cpu.addBreakPoint(runner.baseStackConfigDiff(
                                 {contents: [3, 8]})),
                             'DUPLICATE',
                             cpu.addBreakPoint(runner.baseStackConfigDiff(
                                 {contents: [3, 8, 8]})),
                             'DUPLICATE',
                             cpu.addBreakPoint(runner.baseStackConfigDiff(
                                 {contents: [3, 8, 8, 8]}))]).run();
            },

            'count': function (done) {
                var cpu = runner(done);
                cpu.setCode(['COUNT',
                             cpu.addBreakPoint(runner.baseStackConfigDiff(
                                 {contents: [0]})),
                             'COUNT',
                             cpu.addBreakPoint(runner.baseStackConfigDiff(
                                 {contents: [0, 1]})),
                             'COUNT',
                             cpu.addBreakPoint(runner.baseStackConfigDiff(
                                 {contents: [0, 1, 2]}))]).run();
            },

            'exchange': function (done) {
                var cpu = runner(done);
                cpu.setCode([5, 'PUSH', 'hello',
                             cpu.addBreakPoint(runner.baseStackConfigDiff(
                                 {contents: [5, 'hello']})),
                             'EXCHANGE',
                             cpu.addBreakPoint(runner.baseStackConfigDiff(
                                 {contents: ['hello', 5]})),
                             3489,
                             cpu.addBreakPoint(runner.baseStackConfigDiff(
                                 {contents: ['hello', 5, 3489]})),
                             'EXCHANGE',
                             cpu.addBreakPoint(runner.baseStackConfigDiff(
                                 {contents: ['hello', 3489, 5]})),
                             'EXCHANGE', 'EXCHANGE',
                             cpu.addBreakPoint(runner.baseStackConfigDiff(
                                 {contents: ['hello', 3489, 5]}))]).run();
            },

            'copy': function (done) {
                var cpu = runner(done);
                cpu.setCode([5, 'PUSH', 'hello', 1, 'COPY',
                             cpu.addBreakPoint(runner.baseStackConfigDiff(
                                 {contents: [5, 'hello', 'hello']})),
                             3, 'COPY',
                             cpu.addBreakPoint(runner.baseStackConfigDiff(
                                 {contents: [5, 'hello', 'hello', 5, 'hello', 'hello']})),
                             7, 2, 'COPY',
                             cpu.addBreakPoint(runner.baseStackConfigDiff(
                                 {contents: [5, 'hello', 'hello', 5, 'hello', 'hello', 7, 'hello', 7]}))
                            ]).run();
            },

            'index': function (done) {
                var cpu = runner(done);
                cpu.setCode([5, 0, 'INDEX',
                             cpu.addBreakPoint(runner.baseStackConfigDiff(
                                 {contents: [5, 5]})),
                             3, 2, 0, 'INDEX',
                             cpu.addBreakPoint(runner.baseStackConfigDiff(
                                 {contents: [5, 5, 3, 2, 2]})),
                             2, 'INDEX',
                             cpu.addBreakPoint(runner.baseStackConfigDiff(
                                 {contents: [5, 5, 3, 2, 2, 3]}))
                            ]).run();
            },

            'roll': function (done) {
                var cpu = runner(done);
                cpu.setCode(['PUSH', 'a', 'PUSH', 'b', 'PUSH', 'c', 'PUSH', 'd',
                             3, 0, 'ROLL',
                             cpu.addBreakPoint(runner.baseStackConfigDiff(
                                 {contents: ['a', 'b', 'c', 'd']})),
                             3, 1, 'ROLL',
                             cpu.addBreakPoint(runner.baseStackConfigDiff(
                                 {contents: ['a', 'd', 'b', 'c']})),
                             3, 1, 'ROLL',
                             cpu.addBreakPoint(runner.baseStackConfigDiff(
                                 {contents: ['a', 'c', 'd', 'b']})),
                             3, 4, 'ROLL',
                             cpu.addBreakPoint(runner.baseStackConfigDiff(
                                 {contents: ['a', 'b', 'c', 'd']})),
                             3, -1, 'ROLL',
                             cpu.addBreakPoint(runner.baseStackConfigDiff(
                                 {contents: ['a', 'c', 'd', 'b']})),
                             3, -1, 'ROLL',
                             cpu.addBreakPoint(runner.baseStackConfigDiff(
                                 {contents: ['a', 'd', 'b', 'c']})),
                             3, -7, 'ROLL',
                             cpu.addBreakPoint(runner.baseStackConfigDiff(
                                 {contents: ['a', 'b', 'c', 'd']})),
                             3, 9, 'ROLL',
                             cpu.addBreakPoint(runner.baseStackConfigDiff(
                                 {contents: ['a', 'b', 'c', 'd']})),
                             3, -27, 'ROLL',
                             cpu.addBreakPoint(runner.baseStackConfigDiff(
                                 {contents: ['a', 'b', 'c', 'd']})),
                            ]).run();
            }

        });

    });
}(typeof define === 'function' ? define : function (factory) { module.exports = factory(); }));
