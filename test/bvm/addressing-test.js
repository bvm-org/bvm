(function (define) {
    define(function () {

        'use strict';

        var buster = require('buster'),
            fail = buster.assertions.fail,
            assert = buster.assertions.assert,
            refute = buster.assertions.refute,
            runner = require('./cpuRunner'),
            types = runner.types;

        buster.testCase('addressing ops', {
            'load, store, lexical addresses, address, unknown': function (done) {
                var cpu = runner(done);
                cpu.setCode([0, 0, 'LEXICAL_ADDRESS', 7, 'EXCHANGE', 'DUPLICATE', 'LOAD',
                             cpu.addBreakPoint(runner.baseStackConfigDiff(
                                 {contents: [7, {type: 'lexical', lsl: 0, index: 0},
                                             7]})),
                             'PUSH', 'foo', 'EXCHANGE', 'STORE', 'PUSH', 'bar', 'LOAD',
                             cpu.addBreakPoint(runner.baseStackConfigDiff(
                                 {contents: [7, {type: 'lexical', lsl: 0, index: 0},
                                             types.undef]})),
                             'POP', 'PUSH', 'hello', 'STORE',
                             cpu.addBreakPoint(runner.baseStackConfigDiff(
                                 {contents: ['hello']})),
                             0, 2, 'LEXICAL_ADDRESS', 'EXCHANGE', 'STORE',
                             cpu.addBreakPoint(runner.baseStackConfigDiff(
                                 {contents: [types.undef, types.undef, 'hello']})),
                             'CLEAR', 'PUSH', [0, 0], [0, 0],
                             cpu.addBreakPoint(runner.baseStackConfigDiff(
                                 {contents: [{type: 'lexical', lsl: 0, index: 0},
                                             {type: 'lexical', lsl: 0, index: 0}]})),
                             'LOAD', // !!!!! Is this useful in any way though?
                             cpu.addBreakPoint(runner.baseStackConfigDiff(
                                 {contents: [{type: 'lexical', lsl: 0, index: 0},
                                             {type: 'lexical', lsl: 0, index: 0}]})),
                             'POP', 'PUSH', 'bar', 'ARRAY_NEW', 'STORE', 'foo',
                             cpu.addBreakPoint(runner.baseStackConfigDiff(
                                 {contents: [{type: 'lexical', lsl: 0, index: 0},
                                             7]})),
                             'POP', 'DUPLICATE', 'LOAD', 'bar', 'STORE',
                             cpu.addBreakPoint(runner.baseStackConfigDiff({contents: [[]]})),
                             0, 1, 'ARRAY_STORE',
                             cpu.addBreakPoint(runner.baseStackConfigDiff({contents: [[1]]})),
                             'POP', 'bar',
                             cpu.addBreakPoint(runner.baseStackConfigDiff({contents: [[1]]}))
                            ]).run();
            }
        });

    });
}(typeof define === 'function' ? define : function (factory) { module.exports = factory(); }));
