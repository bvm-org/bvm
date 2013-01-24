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
                var cpu = runner();
                cpu.setCode(['ARRAY_START', 'ARRAY_END',
                             cpu.addBreakPoint(runner.baseStackConfigDiff(
                                 {contents: [[]]}))]).run();
                done();
            },

            'literal non-empty non-deferred': function (done) {
                var cpu = runner();
                cpu.setCode(['ARRAY_START', 'PUSH', 'hello', 5, 7, 'POP', 8, 'ARRAY_END',
                             cpu.addBreakPoint(runner.baseStackConfigDiff(
                                 {contents: [['hello', 5, 8]]}))]).run();
                done();
            },

            'literal nested': function (done) {
                var cpu = runner();
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
                done();
            },

            'new, store, load, length, truncate': function (done) {
                var cpu = runner();
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
                done();
            },

            'references': function (done) {
                var cpu = runner();
                cpu.setCode(['ARRAY_NEW', 0, 47389, 'ARRAY_STORE',
                             'CLONE', 1, 347, 'ARRAY_STORE',
                             cpu.addBreakPoint(runner.baseStackConfigDiff(
                                 {contents: [[47389], [47389, 347]]})),
                             0, 0, 'LEXICAL_ADDRESS', 'LOAD', 1, 'PUSH', 'hello', 'ARRAY_STORE',
                             cpu.addBreakPoint(runner.baseStackConfigDiff(
                                 {contents: [[47389, 'hello'], [47389, 347], [47389, 'hello']]})),
                             0, 0, 'ARRAY_STORE',
                             cpu.addBreakPoint(runner.baseStackConfigDiff(
                                 {contents: [[0, 'hello'],
                                             [47389, 347],
                                             [0, 'hello']]})),
                             0, 2, 'LEXICAL_ADDRESS', 'LOAD', 1, 'ARRAY_TRUNCATE',
                             cpu.addBreakPoint(runner.baseStackConfigDiff(
                                 {contents: [[0],
                                             [47389, 347],
                                             [0],
                                             [0]]})),
                            ]).run();
                done();
            },

            'push, pop, shift, unshift': function (done) {
                var cpu = runner();
                cpu.setCode(['PUSH', 'def',
                             cpu.addBreakPoint(runner.baseStackConfigDiff(
                                 {contents: [
                                     [{type: 'character', contents: 'd'},
                                      {type: 'character', contents: 'e'},
                                      {type: 'character', contents: 'f'}
                                     ]
                                 ]})),
                             ['c'], 'ARRAY_UNSHIFT',
                             ['g'], 'ARRAY_PUSH',
                             cpu.addBreakPoint(runner.baseStackConfigDiff(
                                 {contents: [
                                     [{type: 'character', contents: 'c'},
                                      {type: 'character', contents: 'd'},
                                      {type: 'character', contents: 'e'},
                                      {type: 'character', contents: 'f'},
                                      {type: 'character', contents: 'g'}
                                     ]
                                 ]})),
                             'ARRAY_POP',
                             cpu.addBreakPoint(runner.baseStackConfigDiff(
                                 {contents: [
                                     [{type: 'character', contents: 'c'},
                                      {type: 'character', contents: 'd'},
                                      {type: 'character', contents: 'e'},
                                      {type: 'character', contents: 'f'},
                                     ],
                                     {type: 'character', contents: 'g'}
                                 ]})),
                             'POP',
                             'ARRAY_SHIFT',
                             cpu.addBreakPoint(runner.baseStackConfigDiff(
                                 {contents: [
                                     [{type: 'character', contents: 'd'},
                                      {type: 'character', contents: 'e'},
                                      {type: 'character', contents: 'f'},
                                     ],
                                     {type: 'character', contents: 'c'}
                                 ]}))
                            ]).run();
                done();
            }
        });
    });
}(typeof define === 'function' ? define : function (factory) { module.exports = factory(); }));
