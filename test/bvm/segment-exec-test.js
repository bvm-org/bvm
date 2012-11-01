(function (define) {
    define(function () {

        'use strict';

        var buster = require('buster'),
            fail = buster.assertions.fail,
            assert = buster.assertions.assert,
            refute = buster.assertions.refute,
            runner = require('./cpuRunner'),
            types = runner.types;

        buster.testCase('segment/exec/exit ops', {
            'literal empty': function (done) {
                var cpu = runner(done);
                cpu.setCode([0, 'SEG_START', 'SEG_END', // MUST provide arity
                             cpu.addBreakPoint(runner.baseStackConfigDiff(
                                 {contents: [{type: 'seg', arity: 0, contents: []}]}))
                            ]).run();
            },

            'literal non-empty deferred': function (done) {
                var cpu = runner(done);
                cpu.setCode([0, 'SEG_START', 'PUSH', 'hello', 5, 'EXCHANGE', 'SEG_END',
                             cpu.addBreakPoint(runner.baseStackConfigDiff(
                                 {contents: [{type: 'seg', arity: 0,
                                              contents: ['PUSH', 'hello', 5, 'EXCHANGE']}]}))
                            ]).run();
            },

            'literal nested': function (done) {
                var cpu = runner(done);
                cpu.setCode([0, 'SEG_START', 'PUSH', 'outer', 5,
                             0, 'SEG_START', 'PUSH', 'inner', 6, 'SEG_END',
                             7, 'SEG_END', 15464,
                             cpu.addBreakPoint(runner.baseStackConfigDiff(
                                 {contents: [{type: 'seg', arity: 0, contents:
                                              ['PUSH', 'outer', 5,
                                               0, 'SEG_START', 'PUSH', 'inner', 6, 'SEG_END',
                                               7]}, 15464]}))
                            ]).run();
            },

            'enter 0-arity': function (done) {
                var cpu = runner(done), x = 0;
                cpu.setCode([7, 0, 'SEG_START',
                             cpu.addBreakPoint({lsl: 1, contents: [],
                                                post: function () { assert(x === 1); x += 1; }}),
                             'SEG_END',
                             cpu.addBreakPoint(runner.baseStackConfigDiff(
                                 {contents: [7, {type: 'seg', arity: 0, contents: [runner.breakpoint]}],
                                  post: function () { assert(x === 0); x += 1; }})),
                             'EXEC',
                             cpu.addBreakPoint(runner.baseStackConfigDiff(
                                 {contents: [7],
                                  post: function () { assert(x === 2); }}))
                            ]).run();
            },

            'enter 1-arity': function (done) {
                var cpu = runner(done), x = 0;
                cpu.setCode([1, 7, 1, 'SEG_START',
                             cpu.addBreakPoint({lsl: 1, contents: [7],
                                                post: function () { assert(x === 1); x += 1; }}),
                             'SEG_END',
                             cpu.addBreakPoint(runner.baseStackConfigDiff(
                                 {contents: [1, 7, {type: 'seg', arity: 1,
                                                    contents: [runner.breakpoint]}],
                                  post: function () { assert(x === 0); x += 1; }})),
                             'EXEC',
                             cpu.addBreakPoint(runner.baseStackConfigDiff(
                                 {contents: [1],
                                  post: function () { assert(x === 2); }}))
                            ]).run();
            },

            'enter 2-arity': function (done) {
                var cpu = runner(done), x = 0;
                cpu.setCode([6, 7, 3, 2, 'SEG_START',
                             cpu.addBreakPoint({lsl: 1, contents: [7, 3],
                                                post: function () { assert(x === 1); x += 1; }}),
                             'SEG_END',
                             cpu.addBreakPoint(runner.baseStackConfigDiff(
                                 {contents: [6, 7, 3, {type: 'seg', arity: 2,
                                                       contents: [runner.breakpoint]}],
                                  post: function () { assert(x === 0); x += 1; }})),
                             'EXEC',
                             cpu.addBreakPoint(runner.baseStackConfigDiff(
                                 {contents: [6],
                                  post: function () { assert(x === 2); }}))
                            ]).run();
            },

            'return 0 explicit': function (done) {
                var cpu = runner(done);
                cpu.setCode([0, 'SEG_START', 0,
                             cpu.addBreakPoint({lsl: 1, contents: [0]}),
                             'EXIT', 'SEG_END', 'EXEC',
                             cpu.addBreakPoint(runner.baseStackConfigDiff())
                            ]).run();
            },

            'return 1': function (done) {
                var cpu = runner(done);
                cpu.setCode([0, 'SEG_START', 3, 1,
                             cpu.addBreakPoint({lsl: 1, contents: [3, 1]}),
                             'EXIT', 'SEG_END', 'EXEC',
                             cpu.addBreakPoint(runner.baseStackConfigDiff(
                                 {contents: [3]}))
                            ]).run();
            },

            'return 2': function (done) {
                var cpu = runner(done);
                cpu.setCode([0, 'SEG_START', 6, 3, 17, 2,
                             cpu.addBreakPoint({lsl: 1, contents: [6, 3, 17, 2]}),
                             'EXIT', 'SEG_END', 'EXEC',
                             cpu.addBreakPoint(runner.baseStackConfigDiff(
                                 {contents: [3, 17]}))
                            ]).run();
            },

            'nested invoke': function (done) {
                var cpu = runner(done), x = 0;
                cpu.setCode([3, 1, 'SEG_START',
                               cpu.addBreakPoint({lsl: 1, contents: [3],
                                                  post: function () { assert(x === 1); x += 1; }}),
                               6, 2, 'SEG_START',
                                 cpu.addBreakPoint({lsl: 2, contents: [3, 6],
                                                    post: function () { assert(x === 2); x += 1; }}),
                                 9, 3, 'SEG_START',
                                   cpu.addBreakPoint({lsl: 3, contents: [3, 6, 9],
                                                      post: function () { assert(x === 3); x += 1; }}),
                                   12, 1, 'EXIT', 'SEG_END', 'EXEC',
                                 cpu.addBreakPoint({lsl: 2, contents: [12],
                                                    post: function () { assert(x === 4); x += 1; }}),
                                 15, 1, 'EXIT', 'SEG_END', 'EXEC',
                               cpu.addBreakPoint({lsl: 1, contents: [15],
                                                  post: function () { assert(x === 5); x += 1; }}),
                               18, 1, 'EXIT', 'SEG_END',
                             cpu.addBreakPoint({post: function () { assert(x === 0); x += 1; }}),
                             'EXEC',
                             cpu.addBreakPoint(runner.baseStackConfigDiff(
                                 {contents: [18], post: function () { assert(x === 6); }}))
                            ]).run();
            },

            'closure capture via return': function (done) {
                var cpu = runner(done);
                cpu.setCode([456, 0, 'SEG_START', 'PUSH', 'hello',
                             0, 'SEG_START', 1, 0, 'STACK_COUPLET', 'LOAD', 1, 'EXIT', 'SEG_END',
                             1, 'EXIT', 'SEG_END', 'EXEC',
                             cpu.addBreakPoint(runner.baseStackConfigDiff(
                                 {contents: [456,
                                             {type: 'seg', arity: 0,
                                              contents: [1, 0, 'STACK_COUPLET', 'LOAD', 1, 'EXIT']
                                             }]})),
                             'EXEC',
                             cpu.addBreakPoint(runner.baseStackConfigDiff(
                                 {contents: [456, 'hello']}))
                            ]).run();
            },

            'closure capture via store': function (done) {
                var cpu = runner(done);
                cpu.setCode([456, 0, 'SEG_START', 'PUSH', 'hello',
                             0, 'SEG_START', 1, 0, 'STACK_COUPLET', 'LOAD', 1, 'EXIT', 'SEG_END',
                             0, 0, 'STACK_COUPLET', 'EXCHANGE', 'STORE', 'SEG_END', 'EXEC',
                             cpu.addBreakPoint(runner.baseStackConfigDiff(
                                 {contents: [{type: 'seg', arity: 0,
                                              contents: [1, 0, 'STACK_COUPLET', 'LOAD', 1, 'EXIT']
                                             }]})),
                             'EXEC',
                             cpu.addBreakPoint(runner.baseStackConfigDiff(
                                 {contents: ['hello']}))
                            ]).run();
            },

            'repeated closure capture via store': function (done) {
                var cpu = runner(done);
                cpu.setCode([456, 0, 'SEG_START', 'PUSH', 'hello',
                             0, 'SEG_START', 1, 0, 'STACK_COUPLET', 'DUPLICATE', 'LOAD',
                             'EXCHANGE', 'PUSH', 'goodbye', 'STORE', 1, 'EXIT', 'SEG_END',
                             0, 1, 'STACK_COUPLET', 'EXCHANGE', 'STORE', 'SEG_END', 'EXEC',
                             cpu.addBreakPoint(runner.baseStackConfigDiff(
                                 {contents: [456,
                                             {type: 'seg', arity: 0,
                                              contents: [1, 0, 'STACK_COUPLET', 'DUPLICATE', 'LOAD',
                                                         'EXCHANGE', 'PUSH', 'goodbye', 'STORE', 1, 'EXIT']
                                             }]})),
                             'CLONE', 'EXEC',
                             cpu.addBreakPoint(runner.baseStackConfigDiff(
                                 {contents: [456,
                                             {type: 'seg', arity: 0,
                                              contents: [1, 0, 'STACK_COUPLET', 'DUPLICATE', 'LOAD',
                                                         'EXCHANGE', 'PUSH', 'goodbye', 'STORE', 1, 'EXIT']
                                             },
                                             'hello'
                                            ]})),
                             'POP', 0, 1, 'STACK_COUPLET', 'EXEC',
                             cpu.addBreakPoint(runner.baseStackConfigDiff(
                                 {contents: [456,
                                             {type: 'seg', arity: 0,
                                              contents: [1, 0, 'STACK_COUPLET', 'DUPLICATE', 'LOAD',
                                                         'EXCHANGE', 'PUSH', 'goodbye', 'STORE', 1, 'EXIT']
                                             },
                                             'goodbye']})),
                             'POP', 'EXEC',
                             cpu.addBreakPoint(runner.baseStackConfigDiff({contents: [456, 'goodbye']}))
                            ]).run();
            }
        });

    });
}(typeof define === 'function' ? define : function (factory) { module.exports = factory(); }));
