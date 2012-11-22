(function (define) {
    define(function () {

        'use strict';

        var buster = require('buster'),
            fail = buster.assertions.fail,
            assert = buster.assertions.assert,
            refute = buster.assertions.refute,
            runner = require('./cpuRunner'),
            undef;

        buster.testCase('error ops', {

            'simple error': function (done) {
                var cpu = runner();
                cpu.setCode(['PUSH', 'ERROR NOT ENOUGH OPERANDS',
                             'SEG_START', cpu.addBreakPoint({lsl: 1, dps: undef, contents: []}), 'SEG_END',
                             'STORE', cpu.addBreakPoint(runner.baseStackConfigDiff()), 'ADD'
                            ]).run();
                done();
            },

            'nested errors': function (done) {
                var cpu = runner();
                cpu.setCode(['PUSH', 'ERROR NOT ENOUGH OPERANDS',
                             'SEG_START', cpu.addUnreachablePoint(), 'SEG_END',
                             'STORE',
                             'DICT_START', 'PUSH', 'ERROR NOT ENOUGH OPERANDS',
                             'SEG_START', cpu.addBreakPoint({lsl: 1, dps: undef, contents: []}), 'SEG_END',
                             'DICT_END', 'DICT_STACK_PUSH',
                             cpu.addBreakPoint(runner.baseStackConfigDiff()), 'ADD'
                            ]).run();
                done();
            },

            // This one's a bit specific as it relies on the fact that
            // the maths ops have fixed arity and so error without
            // altering the stack.
            'resumable error': function (done) {
                var cpu = runner();
                cpu.setCode(['PUSH', 'ERROR NOT ENOUGH OPERANDS',
                             'SEG_START', 'TAKE_COUNT', 'DEC', 'TAKE', 17, 'EXCHANGE',
                             cpu.addBreakPoint({lsl: 1, dps: undef,
                                                contents: ['ERROR NOT ENOUGH OPERANDS', 'ADD',
                                                           17, {type: 'stack', contents: [3], lsl: 0}]}),
                             'EXEC', 'SEG_END',
                             'STORE', cpu.addBreakPoint(runner.baseStackConfigDiff()), 3, 'ADD',
                             1, 'TAKE', 'ADD',
                             cpu.addBreakPoint(runner.baseStackConfigDiff({contents: [20]}))
                            ]).run();
                done();
            }

        });

    });
}(typeof define === 'function' ? define : function (factory) { module.exports = factory(); }));
