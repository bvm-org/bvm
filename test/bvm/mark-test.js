(function (define) {
    define(function () {

        'use strict';

        var buster = require('buster'),
            fail = buster.assertions.fail,
            assert = buster.assertions.assert,
            refute = buster.assertions.refute,
            runner = require('./cpuRunner'),
            types = runner.types;

        buster.testRunner.timeout = 10000; // 10 seconds

        buster.testCase('mark ops', {
            'single mark': function (done) {
                var cpu = runner(done);
                cpu.setCode(['PUSH', 'hello', 'MARK', 'COUNT_TO_MARK',
                             cpu.addBreakPoint(runner.baseStackConfigDiff(
                                 {contents: ['hello', types.mark, 0]})),
                             'COUNT_TO_MARK',
                             'COUNT_TO_MARK',
                             cpu.addBreakPoint(runner.baseStackConfigDiff(
                                 {contents: ['hello', types.mark, 0, 1, 2]})),
                             'CLEAR_TO_MARK',
                             cpu.addBreakPoint(runner.baseStackConfigDiff(
                                 {contents: ['hello']}))
                            ]).run();
            },

            'multiple marks': function (done) {
                var cpu = runner(done);
                cpu.setCode(['PUSH', 'a', 'MARK',
                             'PUSH', 'b', 'PUSH', 'c', 'MARK',
                             'PUSH', 'd', 'PUSH', 'e', 'PUSH', 'f', 'MARK',
                             'PUSH', 'g', 'PUSH', 'h', 'PUSH', 'i', 'PUSH', 'j',
                             cpu.addBreakPoint(runner.baseStackConfigDiff(
                                 {contents: ['a', types.mark,
                                             'b', 'c', types.mark,
                                             'd', 'e', 'f', types.mark,
                                             'g', 'h', 'i', 'j']})),
                             'COUNT_TO_MARK', 'COUNT_TO_MARK',
                             cpu.addBreakPoint(runner.baseStackConfigDiff(
                                 {contents: ['a', types.mark,
                                             'b', 'c', types.mark,
                                             'd', 'e', 'f', types.mark,
                                             'g', 'h', 'i', 'j', 4, 5]})),
                             'CLEAR_TO_MARK', 'CLEAR_TO_MARK', 'COUNT_TO_MARK',
                             cpu.addBreakPoint(runner.baseStackConfigDiff(
                                 {contents: ['a', types.mark,
                                             'b', 'c', 2]})),
                             'MARK', 'POP', 'COUNT_TO_MARK',
                             cpu.addBreakPoint(runner.baseStackConfigDiff(
                                 {contents: ['a', types.mark,
                                             'b', 'c', 2, 3]})),
                             'CLEAR_TO_MARK',
                             cpu.addBreakPoint(runner.baseStackConfigDiff(
                                 {contents: ['a']}))

                            ]).run();
            }
        });

    });
}(typeof define === 'function' ? define : function (factory) { module.exports = factory(); }));
