(function (define) {
    define(function () {

        'use strict';

        var buster = require('buster'),
            fail = buster.assertions.fail,
            assert = buster.assertions.assert,
            refute = buster.assertions.refute,
            runner = require('./cpuRunner'),
            types = runner.types,
            undef;

        buster.testCase('comparison ops', {
            'numbers: lt, lte, gt, gte': function (done) {
                var cpu = runner();
                cpu.setCode([4, 10, 'MARK',
                             [0,0], [0,1], 'LT',
                             [0,1], [0,1], 'LT',
                             [0,1], [0,0], 'LT',
                             cpu.addBreakPoint(runner.baseStackConfigDiff({contents: [
                                 4, 10, types.mark, true, false, false
                             ]})), 'CLEAR_TO_MARK', 'MARK',
                             [0,0], [0,1], 'LTE',
                             [0,1], [0,1], 'LTE',
                             [0,1], [0,0], 'LTE',
                             cpu.addBreakPoint(runner.baseStackConfigDiff({contents: [
                                 4, 10, types.mark, true, true, false
                             ]})), 'CLEAR_TO_MARK', 'MARK',
                             [0,0], [0,1], 'GT',
                             [0,1], [0,1], 'GT',
                             [0,1], [0,0], 'GT',
                             cpu.addBreakPoint(runner.baseStackConfigDiff({contents: [
                                 4, 10, types.mark, false, false, true
                             ]})), 'CLEAR_TO_MARK', 'MARK',
                             [0,0], [0,1], 'GTE',
                             [0,1], [0,1], 'GTE',
                             [0,1], [0,0], 'GTE',
                             cpu.addBreakPoint(runner.baseStackConfigDiff({contents: [
                                 4, 10, types.mark, false, true, true
                             ]}))
                            ]).run();
                done();
            },

            'characters: lt, lte, gt, gte': function (done) {
                var cpu = runner();
                cpu.setCode([['a'], ['b'], 'MARK',
                             [0,0], [0,1], 'LT',
                             [0,1], [0,1], 'LT',
                             [0,1], [0,0], 'LT',
                             cpu.addBreakPoint(runner.baseStackConfigDiff({contents: [
                                 {type: 'character', contents: 'a'},
                                 {type: 'character', contents: 'b'},
                                 types.mark, true, false, false
                             ]})), 'CLEAR_TO_MARK', 'MARK',
                             [0,0], [0,1], 'LTE',
                             [0,1], [0,1], 'LTE',
                             [0,1], [0,0], 'LTE',
                             cpu.addBreakPoint(runner.baseStackConfigDiff({contents: [
                                 {type: 'character', contents: 'a'},
                                 {type: 'character', contents: 'b'},
                                 types.mark, true, true, false
                             ]})), 'CLEAR_TO_MARK', 'MARK',
                             [0,0], [0,1], 'GT',
                             [0,1], [0,1], 'GT',
                             [0,1], [0,0], 'GT',
                             cpu.addBreakPoint(runner.baseStackConfigDiff({contents: [
                                 {type: 'character', contents: 'a'},
                                 {type: 'character', contents: 'b'},
                                 types.mark, false, false, true
                             ]})), 'CLEAR_TO_MARK', 'MARK',
                             [0,0], [0,1], 'GTE',
                             [0,1], [0,1], 'GTE',
                             [0,1], [0,0], 'GTE',
                             cpu.addBreakPoint(runner.baseStackConfigDiff({contents: [
                                 {type: 'character', contents: 'a'},
                                 {type: 'character', contents: 'b'},
                                 types.mark, false, true, true
                             ]}))
                            ]).run();
                done();
            },

            'eq': function (done) {
                var cpu = runner();
                cpu.setCode([
                    5, 5, 'EQ', 4, 5, 'EQ',
                    cpu.addBreakPoint(runner.baseStackConfigDiff({contents: [true, false]})),
                    'CLEAR',
                    ['a'], ['a'], 'EQ', ['a'], ['b'], 'EQ',
                    cpu.addBreakPoint(runner.baseStackConfigDiff({contents: [true, false]})),
                    'CLEAR',
                    'PUSH', 'a', 'DUPLICATE', 'EQ', 'PUSH', 'a', 'PUSH', 'b', 'EQ',
                    cpu.addBreakPoint(runner.baseStackConfigDiff({contents: [true, false]})),
                    'CLEAR',
                    'TRUE', 'TRUE', 'EQ', 'TRUE', 'FALSE', 'EQ',
                    cpu.addBreakPoint(runner.baseStackConfigDiff({contents: [true, false]})),
                    'CLEAR',
                    'MARK', 'MARK', 'EQ', 'UNDEF', 'UNDEF', 'EQ',
                    cpu.addBreakPoint(runner.baseStackConfigDiff({contents: [true, true]})),
                    'CLEAR',
                    'PUSH', [0,1], 0, 1, 'LEXICAL_ADDRESS', 'EQ',
                    'SEG_START', 'PUSH', [undefined, 0], 1, 'RETURN', 'SEG_END', 'DUPLICATE',
                    'EXEC', 'EXCHANGE', 'EXEC', 'EQ',
                    cpu.addBreakPoint(runner.baseStackConfigDiff({contents: [true, false]})),
                    'CLEAR',
                    'ARRAY_START', 5, 3, 'PUSH', 'a', 'ARRAY_END', 'DUPLICATE', 'DUPLICATE',
                    'EQ', 'EXCHANGE', 'CLONE', 'EQ',
                    cpu.addBreakPoint(runner.baseStackConfigDiff({contents: [true, false]})),
                    'CLEAR',
                    'ARRAY_START', 5, 3, 'PUSH', 'a', 'ARRAY_END', 'DUPLICATE', 'DUPLICATE',
                    'ARRAY_EQ', 'EXCHANGE', 'CLONE', 'ARRAY_EQ',
                    cpu.addBreakPoint(runner.baseStackConfigDiff({contents: [true, true]})),
                    'CLEAR',
                    'SEG_START', 'PUSH', [1,0], 1, 'RETURN', 'SEG_END', 'DUPLICATE', 'DUPLICATE',
                    'EQ', 'EXCHANGE', 'CLONE', 'EQ',
                    cpu.addBreakPoint(runner.baseStackConfigDiff({contents: [true, false]})),
                    'POP', 5, 'EQ',
                    cpu.addBreakPoint(runner.baseStackConfigDiff({contents: [false]}))
                ]).run();
                done();
            }
        });

    });
}(typeof define === 'function' ? define : function (factory) { module.exports = factory(); }));
