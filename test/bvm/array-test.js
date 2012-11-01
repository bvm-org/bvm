(function (define) {
    define(function () {

        'use strict';

        var buster = require('buster'),
            fail = buster.assertions.fail,
            assert = buster.assertions.assert,
            refute = buster.assertions.refute,
            runner = require('./cpuRunner'),
            types = runner.types;

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
                             'ARRAY_START', 12, 'ARRAY_END', 'DUPLICATE', 'CLONE', 'ARRAY_END',
                             cpu.addBreakPoint(runner.baseStackConfigDiff(
                                 {contents: [[[5, 'inner'], 17, 'foo', 'foo', [12], [12], [12]]],
                                 post: function (stack) {
                                     var ary = stack.index(0);
                                     assert(ary.index(4).index(0) === 12);
                                     assert(ary.index(5).index(0) === 12);
                                     assert(ary.index(4) === ary.index(5));
                                     assert(ary.index(5) !== ary.index(6));
                                 }}))
                            ]).run();
            },

            'new, store, load, length, truncate': function (done) {
                var cpu = runner(done);
                cpu.setCode(['ARRAY_NEW',
                             cpu.addBreakPoint(runner.baseStackConfigDiff(
                                 {contents: [[]]})),
                             0, 'PUSH', 'hello', 'ARRAY_STORE',
                             cpu.addBreakPoint(runner.baseStackConfigDiff(
                                 {contents: [['hello']]})),
                             0, 'PUSH', 'goodbye', 'ARRAY_STORE',
                             cpu.addBreakPoint(runner.baseStackConfigDiff(
                                 {contents: [['goodbye']]})),
                             2, 17, 'ARRAY_STORE',
                             1, 'ARRAY_LOAD',
                             cpu.addBreakPoint(runner.baseStackConfigDiff(
                                 {contents: [['goodbye', types.undef, 17], types.undef]})),
                             2, 'EXCHANGE', 'ARRAY_STORE',
                             cpu.addBreakPoint(runner.baseStackConfigDiff(
                                 {contents: [['goodbye', types.undef, types.undef]]})),
                             'ARRAY_LENGTH',
                             cpu.addBreakPoint(runner.baseStackConfigDiff(
                                 {contents: [['goodbye', types.undef, types.undef], 3]})),
                             'POP', 1, 'ARRAY_TRUNCATE',
                             cpu.addBreakPoint(runner.baseStackConfigDiff(
                                 {contents: [['goodbye']]})),
                             2, 'ARRAY_TRUNCATE',
                             cpu.addBreakPoint(runner.baseStackConfigDiff(
                                 {contents: [['goodbye', types.undef]]}))
                            ]).run();
            },

            'references': function (done) {
                var cpu = runner(done);
                cpu.setCode(['ARRAY_NEW', 0, 47389, 'ARRAY_STORE',
                             'CLONE', 1, 347, 'ARRAY_STORE',
                             cpu.addBreakPoint(runner.baseStackConfigDiff(
                                 {contents: [[47389], [47389, 347]]})),
                             0, 0, 'STACK_COUPLET', 'LOAD', 1, 'PUSH', 'hello', 'ARRAY_STORE',
                             cpu.addBreakPoint(runner.baseStackConfigDiff(
                                 {contents: [[47389, 'hello'], [47389, 347], [47389, 'hello']]})),
                             0, 0, 'ARRAY_STORE',
                             cpu.addBreakPoint(runner.baseStackConfigDiff(
                                 {contents: [[0, 'hello'],
                                             [47389, 347],
                                             [0, 'hello']]})),
                             0, 2, 'STACK_COUPLET', 'LOAD', 1, 'ARRAY_TRUNCATE',
                             cpu.addBreakPoint(runner.baseStackConfigDiff(
                                 {contents: [[0],
                                             [47389, 347],
                                             [0],
                                             [0]]})),
                            ]).run();
            }
        });
    });
}(typeof define === 'function' ? define : function (factory) { module.exports = factory(); }));
