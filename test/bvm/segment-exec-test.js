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
            },

            'suspend single': function (done) {
                var cpu = runner(done), x = 0;
                cpu.setCode([123, 2, 'SEG_START',
                               cpu.addBreakPoint(
                                   {lsl: 1,
                                    contents: ['hello', {type: 'stack', contents: [123], lsl: 0}],
                                    post: function () { assert(x === 0); x += 1; }}),
                               'PUSH', 'goodbye', 'EXCHANGE', 'EXEC',
                                cpu.addBreakPoint({lsl: 1,
                                                   contents: ['hello'],
                                                   post: function () { assert(x === 2); }}),
                             'SEG_END',
                             'PUSH', 'hello', 'EXCHANGE', 'SUSPEND',
                             cpu.addBreakPoint({contents: [123, 'goodbye'], lsl: 0,
                                                post: function () { assert(x === 1); x += 1; }})
                            ]).run();
            },

            'suspend multiple': function (done) {
                var cpu = runner(done);
                cpu.setCode([123,
                             1, 'SEG_START',
                               2, 'SEG_START',
                                 'PUSH', 'goodbye', 2, 0, 'STACK_COUPLET', 'EXEC',
                                 cpu.addBreakPoint({
                                     contents: [
                                         {type: 'stack', contents: [123, 'goodbye'], lsl: 0},
                                         {type: 'stack', contents: [], lsl: 1},
                                         7],
                                     lsl: 2}),
                                 'EXCHANGE', 'SUSPEND', // NB suspending into a suspension!
                                 cpu.addUnreachablePoint(),
                               'SEG_END', 'SUSPEND',
                               cpu.addBreakPoint({
                                   contents: [{type: 'stack', contents: [
                                       {type: 'stack', contents: [123, 'goodbye'], lsl: 0},
                                       7]}],
                                   dps: undefined, lsl: 1}),
                             'SEG_END', 'SUSPEND',
                             cpu.addBreakPoint({contents: [123, 'goodbye'], lsl: 0}),
                             7, 1, 'EXIT'
                            ]).run();
            },

            'suspend loop': function (done) {
                var cpu = runner(done), results = [5, 5];
                cpu.setCode([1, 'SEG_START', 'DUPLICATE', 'EXEC',
                               cpu.addBreakPoint({lsl: 1, dps: undefined, contents: [6]}),
                               // We actually stop (eventually) here.
                               'SEG_END',
                             'SUSPEND',
                             // At this point, 1st time through, top
                             // of stack is the stack itself as a
                             // continuation from here.
                             5, 'EXCHANGE', 'EXEC',
                             // 1st time through, 5 is provided as an
                             // arg to the continuation. Thus 2nd time
                             // through, continuation starts with a 5.
                             // We then add another 5, and EXEC on 5
                             // is a noop, so now [5, 5].
                             cpu.addBreakPoint({contents: results, lsl: 0,
                                                post: function () { results.push(7); results.push(6); }}),
                             // EXECing a stack sets the return
                             // pointer of the newly cloned stack to
                             // the current stack. So when we first
                             // get here, the return pointer is back
                             // to the above breakpoint. Hence the 7,
                             // 6 appearing on the stack - the 7
                             // directly and demonstrates it's the
                             // same stack, the 6 via the EXIT
                             // opcode. When we get here the 2nd time,
                             // the return pointer is actually back to
                             // the inner segment, hence 6 being
                             // passed on its own up there.
                             7, 6, 1, 'EXIT',
                             cpu.addUnreachablePoint()
                            ]).run();
            }
        });

    });
}(typeof define === 'function' ? define : function (factory) { module.exports = factory(); }));
