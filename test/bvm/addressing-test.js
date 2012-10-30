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

        buster.testCase('addressing ops', {
            'load, store, address couplet, address, unknown': function (done) {
                var cpu = runner(done);
                cpu.setCode([0, 0, 'STACK_COUPLET', 7, 'EXCHANGE', 'DUPLICATE', 'LOAD',
                             cpu.addBreakPoint(runner.baseStackConfigDiff(
                                 {contents: [7, {type: 'couplet', lsl: 0, index: 0},
                                             7]})),
                             'PUSH', 'foo', 'EXCHANGE', 'STORE', 'PUSH', 'bar', 'LOAD',
                             cpu.addBreakPoint(runner.baseStackConfigDiff(
                                 {contents: [7, {type: 'couplet', lsl: 0, index: 0},
                                             types.undef]})),
                             'POP', 'PUSH', 'hello', 'STORE',
                             cpu.addBreakPoint(runner.baseStackConfigDiff(
                                 {contents: ['hello']})),
                             0, 2, 'STACK_COUPLET', 'EXCHANGE', 'STORE',
                             cpu.addBreakPoint(runner.baseStackConfigDiff(
                                 {contents: [types.undef, types.undef, 'hello']})),
                             'CLEAR', 0, 0, 'STACK_COUPLET', 'ADDRESS', 'DUPLICATE', 'LOAD',
                             cpu.addBreakPoint(runner.baseStackConfigDiff(
                                 {contents: [{type: 'ptr', target: {type: 'couplet', lsl: 0, index: 0}},
                                             {type: 'couplet', lsl: 0, index: 0}]})),
                             'LOAD', // !!!!! Is this useful in any way though?
                             cpu.addBreakPoint(runner.baseStackConfigDiff(
                                 {contents: [{type: 'ptr', target: {type: 'couplet', lsl: 0, index: 0}},
                                             {type: 'ptr', target: {type: 'couplet', lsl: 0, index: 0}}]})),
                             'PUSH', 'bar', 'EXCHANGE', 'STORE', 'foo',
                             cpu.addBreakPoint(runner.baseStackConfigDiff(
                                 {contents: [{type: 'ptr', target: {type: 'couplet', lsl: 0, index: 0}},
                                             7]})),
                             'bar', 'LOAD', 'EXCHANGE', 'STORE',
                             cpu.addBreakPoint(runner.baseStackConfigDiff({contents: [7]}))
                            ]).run();
            }
        });

    });
}(typeof define === 'function' ? define : function (factory) { module.exports = factory(); }));
