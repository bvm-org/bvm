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

        buster.testCase('segment/exec/exit ops', {
            'literal empty': function (done) {
                var cpu = runner(done);
                cpu.setCode(['SEG_START', 'SEG_END',
                             cpu.addBreakPoint(runner.baseStackConfigDiff(
                                 {contents: [{type: 'seg', contents: []}]}))
                            ]).run();
            },

            'literal non-empty deferred': function (done) {
                var cpu = runner(done);
                cpu.setCode(['SEG_START', 'PUSH', 'hello', 5, 'EXCHANGE', 'SEG_END',
                             cpu.addBreakPoint(runner.baseStackConfigDiff(
                                 {contents: [{type: 'seg',
                                              contents: ['PUSH', 'hello', 5, 'EXCHANGE']}]}))
                            ]).run();
            },

            'literal nested': function (done) {
                var cpu = runner(done);
                cpu.setCode(['SEG_START', 'PUSH', 'outer', 5,
                             'SEG_START', 'PUSH', 'inner', 6, 'SEG_END',
                             7, 'SEG_END', 15464,
                             cpu.addBreakPoint(runner.baseStackConfigDiff(
                                 {contents: [{type: 'seg', contents:
                                              ['PUSH', 'outer', 5,
                                               'SEG_START', 'PUSH', 'inner', 6, 'SEG_END',
                                               7]}, 15464]}))
                            ]).run();
            },

            'enter 0-arity': function (done) {
                var cpu = runner(done), x = 0;
                cpu.setCode([7, 'SEG_START',
                             cpu.addBreakPoint({lsl: 1, contents: [],
                                                post: function () { assert(x === 1); x += 1; }}),
                             'SEG_END',
                             cpu.addBreakPoint(runner.baseStackConfigDiff(
                                 {contents: [7, {type: 'seg', contents: [runner.breakpoint]}],
                                  post: function () { assert(x === 0); x += 1; }})),
                             0, 'EXEC',
                             cpu.addBreakPoint(runner.baseStackConfigDiff(
                                 {contents: [7],
                                  post: function () { assert(x === 2); }}))
                            ]).run();
            },

            'enter 1-arity': function (done) {
                var cpu = runner(done), x = 0;
                cpu.setCode([3, 'SEG_START',
                             cpu.addBreakPoint({lsl: 1, contents: [7],
                                                post: function () { assert(x === 1); x += 1; }}),
                             'SEG_END', 7, 1,
                             cpu.addBreakPoint(runner.baseStackConfigDiff(
                                 {contents: [3, {type: 'seg',
                                                 contents: [runner.breakpoint]},
                                             7, 1],
                                  post: function () { assert(x === 0); x += 1; }})),
                             'EXEC',
                             cpu.addBreakPoint(runner.baseStackConfigDiff(
                                 {contents: [3],
                                  post: function () { assert(x === 2); }}))
                            ]).run();
            },

            'enter 2-arity': function (done) {
                var cpu = runner(done), x = 0;
                cpu.setCode([6, 'SEG_START',
                             cpu.addBreakPoint({lsl: 1, contents: [7, 3],
                                                post: function () { assert(x === 1); x += 1; }}),
                             'SEG_END', 7, 3, 2,
                             cpu.addBreakPoint(runner.baseStackConfigDiff(
                                 {contents: [6, {type: 'seg',
                                                 contents: [runner.breakpoint]},
                                             7, 3, 2],
                                  post: function () { assert(x === 0); x += 1; }})),
                             'EXEC',
                             cpu.addBreakPoint(runner.baseStackConfigDiff(
                                 {contents: [6],
                                  post: function () { assert(x === 2); }}))
                            ]).run();
            },

            'return 0 explicit': function (done) {
                var cpu = runner(done);
                cpu.setCode(['SEG_START', 0,
                             cpu.addBreakPoint({lsl: 1, contents: [0]}),
                             'EXIT', 'SEG_END', 0, 'EXEC',
                             cpu.addBreakPoint(runner.baseStackConfigDiff())
                            ]).run();
            },

            'return 1': function (done) {
                var cpu = runner(done);
                cpu.setCode(['SEG_START', 3, 1,
                             cpu.addBreakPoint({lsl: 1, contents: [3, 1]}),
                             'EXIT', 'SEG_END', 0, 'EXEC',
                             cpu.addBreakPoint(runner.baseStackConfigDiff(
                                 {contents: [3]}))
                            ]).run();
            },

            'return 2': function (done) {
                var cpu = runner(done);
                cpu.setCode(['SEG_START', 6, 3, 17, 2,
                             cpu.addBreakPoint({lsl: 1, contents: [6, 3, 17, 2]}),
                             'EXIT', 'SEG_END', 0, 'EXEC',
                             cpu.addBreakPoint(runner.baseStackConfigDiff(
                                 {contents: [3, 17]}))
                            ]).run();
            },

            'nested invoke': function (done) {
                var cpu = runner(done), x = 0;
                cpu.setCode(['SEG_START',
                               cpu.addBreakPoint({lsl: 1, contents: [3],
                                                  post: function () { assert(x === 1); x += 1; }}),
                               'SEG_START',
                                 cpu.addBreakPoint({lsl: 2, contents: [3, 6],
                                                    post: function () { assert(x === 2); x += 1; }}),
                                 'SEG_START',
                                   cpu.addBreakPoint({lsl: 3, contents: [3, 6, 9],
                                                      post: function () { assert(x === 3); x += 1; }}),
                                   12, 1, 'EXIT',
                                 'SEG_END', 3, 1, 'ROLL', 9, 3, 'EXEC',
                                 cpu.addBreakPoint({lsl: 2, contents: [12],
                                                    post: function () { assert(x === 4); x += 1; }}),
                                 15, 1, 'EXIT',
                                 'SEG_END', 'EXCHANGE', 6, 2, 'EXEC',
                               cpu.addBreakPoint({lsl: 1, contents: [15],
                                                  post: function () { assert(x === 5); x += 1; }}),
                               18, 1, 'EXIT', 'SEG_END',
                             cpu.addBreakPoint({post: function () { assert(x === 0); x += 1; }}),
                             3, 1, 'EXEC',
                             cpu.addBreakPoint(runner.baseStackConfigDiff(
                                 {contents: [18], post: function () { assert(x === 6); }}))
                            ]).run();
            },

            'closure capture via return': function (done) {
                var cpu = runner(done);
                cpu.setCode([456, 'SEG_START', 'PUSH', 'hello',
                             'SEG_START', 1, 0, 'LEXICAL_ADDRESS', 'LOAD', 1, 'EXIT', 'SEG_END',
                             1, 'EXIT', 'SEG_END', 0, 'EXEC',
                             cpu.addBreakPoint(runner.baseStackConfigDiff(
                                 {contents: [456,
                                             {type: 'seg',
                                              contents: [1, 0, 'LEXICAL_ADDRESS', 'LOAD', 1, 'EXIT']
                                             }]})),
                             0, 'EXEC',
                             cpu.addBreakPoint(runner.baseStackConfigDiff(
                                 {contents: [456, 'hello']}))
                            ]).run();
            },

            'closure capture via store': function (done) {
                var cpu = runner(done);
                cpu.setCode([456, 'SEG_START', 'PUSH', 'hello',
                             'SEG_START', 1, 0, 'LEXICAL_ADDRESS', 'LOAD', 1, 'EXIT', 'SEG_END',
                             0, 0, 'LEXICAL_ADDRESS', 'EXCHANGE', 'STORE', 'SEG_END', 0, 'EXEC',
                             cpu.addBreakPoint(runner.baseStackConfigDiff(
                                 {contents: [{type: 'seg',
                                              contents: [1, 0, 'LEXICAL_ADDRESS', 'LOAD', 1, 'EXIT']
                                             }]})),
                             0, 'EXEC',
                             cpu.addBreakPoint(runner.baseStackConfigDiff(
                                 {contents: ['hello']}))
                            ]).run();
            },

            'repeated closure capture via store': function (done) {
                var cpu = runner(done);
                cpu.setCode([456, 'SEG_START', 'PUSH', 'hello',
                             'SEG_START', 1, 0, 'LEXICAL_ADDRESS', 'DUPLICATE', 'LOAD',
                             'EXCHANGE', 'PUSH', 'goodbye', 'STORE', 1, 'EXIT', 'SEG_END',
                             0, 1, 'LEXICAL_ADDRESS', 'EXCHANGE', 'STORE', 'SEG_END', 0, 'EXEC',
                             cpu.addBreakPoint(runner.baseStackConfigDiff(
                                 {contents: [456,
                                             {type: 'seg',
                                              contents: [1, 0, 'LEXICAL_ADDRESS', 'DUPLICATE', 'LOAD',
                                                         'EXCHANGE', 'PUSH', 'goodbye', 'STORE', 1, 'EXIT']
                                             }]})),
                             'CLONE', 0, 'EXEC',
                             cpu.addBreakPoint(runner.baseStackConfigDiff(
                                 {contents: [456,
                                             {type: 'seg',
                                              contents: [1, 0, 'LEXICAL_ADDRESS', 'DUPLICATE', 'LOAD',
                                                         'EXCHANGE', 'PUSH', 'goodbye', 'STORE', 1, 'EXIT']
                                             },
                                             'hello'
                                            ]})),
                             'POP', 0, 1, 'LEXICAL_ADDRESS', 0, 'EXEC',
                             cpu.addBreakPoint(runner.baseStackConfigDiff(
                                 {contents: [456,
                                             {type: 'seg',
                                              contents: [1, 0, 'LEXICAL_ADDRESS', 'DUPLICATE', 'LOAD',
                                                         'EXCHANGE', 'PUSH', 'goodbye', 'STORE', 1, 'EXIT']
                                             },
                                             'goodbye']})),
                             'POP', 0, 'EXEC',
                             cpu.addBreakPoint(runner.baseStackConfigDiff({contents: [456, 'goodbye']}))
                            ]).run();
            },

            'callcc single': function (done) {
                var cpu = runner(done), x = 0;
                cpu.setCode([123, 'SEG_START',
                               cpu.addBreakPoint(
                                   {lsl: 1,
                                    contents: ['hello', {type: 'stack', contents: [123], lsl: 0}],
                                    post: function () { assert(x === 0); x += 1; }}),
                               'PUSH', 'goodbye', 1, 'EXEC',
                                cpu.addBreakPoint({lsl: 1,
                                                   contents: ['hello'],
                                                   post: function () { assert(x === 2); }}),
                             'SEG_END',
                             'PUSH', 'hello', 1, 'CALLCC',
                             cpu.addBreakPoint({contents: [123, 'goodbye'], lsl: 0,
                                                post: function () { assert(x === 1); x += 1; }})
                            ]).run();
            },

            'callcc multiple': function (done) {
                var cpu = runner(done);
                cpu.setCode([123,
                             'SEG_START',
                               'SEG_START',
                                 2, 0, 'LEXICAL_ADDRESS', 'PUSH', 'goodbye', 1, 'EXEC',
                                 cpu.addBreakPoint({
                                     contents: [
                                         {type: 'stack', contents: [123, 'goodbye'], lsl: 0},
                                         {type: 'stack', contents: [], lsl: 1},
                                         7],
                                     lsl: 2}),
                                 1, 'CALLCC', // NB suspending into a suspension!
                                 cpu.addUnreachablePoint(),
                               'SEG_END', 'EXCHANGE', 1, 'CALLCC',
                               cpu.addBreakPoint({
                                   contents: [7,
                                              {type: 'stack', lsl: 2, contents:
                                               [{type: 'stack', contents: [123, 'goodbye'], lsl: 0}]}],
                                   dps: undef, lsl: 1}),
                             'SEG_END', 0, 'CALLCC',
                             cpu.addBreakPoint({contents: [123, 'goodbye'], lsl: 0}),
                             7, 1, 'EXIT'
                            ]).run();
            },

            'callcc loop': function (done) {
                var cpu = runner(done), results = [5];
                cpu.setCode(['SEG_START', 'DUPLICATE', 1, 'EXEC',
                               cpu.addBreakPoint({lsl: 1, dps: undef, contents: [5, 6]}),
                               // We actually stop (eventually) here.
                             'SEG_END',
                             0, 'CALLCC',
                             // At this point, 1st time through, top
                             // of stack is the stack itself as a
                             // continuation from here.
                             'DUPLICATE', 5, 'SEG_START', 'SEG_END', 3, 'EXEC',
                             // k == the contination of ourself from after the above callcc
                             // a == the empty segment just created
                             // 1st: k, k, 5, a, 3];       (exec k(k, 5, a)), which leads to:
                             // 2nd: k, 5, a, a, 5, a, 3]; (exec a(a, 5, a))
                             // After execing a, we're left with a stack of [k, 5]
                             'EXCHANGE', 'POP',
                             cpu.addBreakPoint({contents: results, lsl: 0,
                                                post: function () { results.push(7); results.push(6); }}),
                             // EXECing a stack sets the return
                             // pointer of the newly cloned stack to
                             // the current stack. So when we first
                             // get here, the return pointer is back
                             // to the above breakpoint. Hence the 7,
                             // 6 appearing on the stack - the 7
                             // directly and demonstrates it's the
                             // same stack, the 6 via the EXIT opcode
                             // (along with the 5, but then the
                             // EXCHANGE+POP happens). When we get
                             // here the 2nd time, the return pointer
                             // is actually back to the inner segment,
                             // hence 5 and 6 being passed up there.
                             7, 5, 6, 2, 'EXIT',
                             cpu.addUnreachablePoint()
                            ]).run();
            }
        });

    });
}(typeof define === 'function' ? define : function (factory) { module.exports = factory(); }));
