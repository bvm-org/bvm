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

        buster.testCase('array ops', {
            'literal empty': function (done) {
                var cpu = runner(done);
                cpu.setCode(['ARRAY_START', 'ARRAY_END',
                             cpu.addBreakPoint(runner.baseStackConfigDiff(
                                 {contents: [[]]}))]).run();
            },

            'literal non-empty non-deferred': function (done) {
                var cpu = runner(done);
                cpu.setCode(['ARRAY_START', 'PUSH', 'hello', 5, 7, 'POP', 8, 'ARRAY_END',
                             cpu.addBreakPoint(runner.baseStackConfigDiff(
                                 {contents: [['hello', 5, 8]]}))]).run();
            },

            'literal nested': function (done) {
                var cpu = runner(done);
                cpu.setCode(['ARRAY_START',
                             'ARRAY_START', 5, 'PUSH', 'inner', 'ARRAY_END',
                             cpu.addBreakPoint(runner.baseStackConfigDiff(
                                 {contents: [types.mark, [5, 'inner']]})),
                             17, 'PUSH', 'foo', 'PUSH', 'wibble', 'POP', 'DUPLICATE',
                             'ARRAY_START', 12, 'ARRAY_END', 'DUPLICATE', 'ARRAY_END',
                             cpu.addBreakPoint(runner.baseStackConfigDiff(
                                 {contents: [[[5, 'inner'], 17, 'foo', 'foo', [12], [12]]],
                                 fun: function (stack) {
                                     var ary = stack.index(0);
                                     assert(ary.index(4).index(0) === 12);
                                     assert(ary.index(5).index(0) === 12);
                                     assert(ary.index(4) !== ary.index(5));
                                 }}))
                            ]).run();
            },

            'new, store, load': function (done) {
                var cpu = runner(done);
                cpu.setCode([1, 'ARRAY_NEW',
                             cpu.addBreakPoint(runner.baseStackConfigDiff(
                                 {contents: [[undefined]]})),
                             'ADDRESS', 'DUPLICATE', 'LOAD',
                             0, 'PUSH', 'hello', 'ARRAY_STORE', 'LOAD',
                             cpu.addBreakPoint(runner.baseStackConfigDiff(
                                 {contents: [['hello']]})),
                             'ADDRESS', 'DUPLICATE', 'LOAD',
                             0, 'PUSH', 'goodbye', 'ARRAY_STORE', 'LOAD',
                             cpu.addBreakPoint(runner.baseStackConfigDiff(
                                 {contents: [['goodbye']]}))
                            ]).run();
            }
        });
    });
}(typeof define === 'function' ? define : function (factory) { module.exports = factory(); }));
