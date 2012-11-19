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

        buster.testCase('segment/exec/return/callcc/take ops', {
            'literal empty': function (done) {
                var cpu = runner();
                cpu.setCode(['SEG_START', 'SEG_END',
                             cpu.addBreakPoint(runner.baseStackConfigDiff(
                                 {contents: [{type: 'seg', contents: []}]}))
                            ]).run();
                done();
            },

            'literal non-empty deferred': function (done) {
                var cpu = runner();
                cpu.setCode(['SEG_START', 'PUSH', 'hello', 5, 'EXCHANGE', 'SEG_END',
                             cpu.addBreakPoint(runner.baseStackConfigDiff(
                                 {contents: [{type: 'seg',
                                              contents: ['PUSH', 'hello', 5, 'EXCHANGE']}]}))
                            ]).run();
                done();
            },

            'literal nested': function (done) {
                var cpu = runner();
                cpu.setCode(['SEG_START', 'PUSH', 'outer', 5,
                             'SEG_START', 'PUSH', 'inner', 6, 'SEG_END',
                             7, 'SEG_END', 15464,
                             cpu.addBreakPoint(runner.baseStackConfigDiff(
                                 {contents: [{type: 'seg', contents:
                                              ['PUSH', 'outer', 5,
                                               'SEG_START', 'PUSH', 'inner', 6, 'SEG_END',
                                               7]}, 15464]}))
                            ]).run();
                done();
            },

            'enter 0-arity': function (done) {
                var cpu = runner(), x = 0;
                cpu.setCode([7, 'SEG_START',
                             cpu.addBreakPoint({lsl: 1, contents: [],
                                                post: function () { assert(x === 1); x += 1; }}),
                             'SEG_END',
                             cpu.addBreakPoint(runner.baseStackConfigDiff(
                                 {contents: [7, {type: 'seg', contents: [runner.breakpoint]}],
                                  post: function () { assert(x === 0); x += 1; }})),
                             'EXEC',
                             cpu.addBreakPoint(runner.baseStackConfigDiff(
                                 {contents: [7],
                                  post: function () { assert(x === 2); }}))
                            ]).run();
                done();
            },

            'enter 1-arity': function (done) {
                var cpu = runner(), x = 0;
                cpu.setCode([3, 7, 'SEG_START',
                             cpu.addBreakPoint({lsl: 1, contents: [],
                                                post: function () { assert(x === 1); x += 1; }}),
                             1, 'TAKE',
                             cpu.addBreakPoint({lsl: 1, contents: [7],
                                                post: function () { assert(x === 2); x += 1; }}),
                             'SEG_END',
                             cpu.addBreakPoint(runner.baseStackConfigDiff(
                                 {contents: [3, 7,
                                             {type: 'seg', contents: [
                                                 runner.breakpoint, 1, 'TAKE', runner.breakpoint]}],
                                  post: function () { assert(x === 0); x += 1; }})),
                             'EXEC',
                             cpu.addBreakPoint(runner.baseStackConfigDiff(
                                 {contents: [3],
                                  post: function () { assert(x === 3); }}))
                            ]).run();
                done();
            },

            'enter 2-arity': function (done) {
                var cpu = runner(), x = 0;
                cpu.setCode([6, 7, 3, 'SEG_START', 2, 'TAKE',
                             cpu.addBreakPoint({lsl: 1, contents: [7, 3],
                                                post: function () { assert(x === 1); x += 1; }}),
                             'SEG_END',
                             cpu.addBreakPoint(runner.baseStackConfigDiff(
                                 {contents: [6, 7, 3, {type: 'seg',
                                                       contents: [2, 'TAKE', runner.breakpoint]}],
                                  post: function () { assert(x === 0); x += 1; }})),
                             'EXEC',
                             cpu.addBreakPoint(runner.baseStackConfigDiff(
                                 {contents: [6],
                                  post: function () { assert(x === 2); }}))
                            ]).run();
                done();
            },

            'return 0 explicit': function (done) {
                var cpu = runner();
                cpu.setCode(['SEG_START', 0,
                             cpu.addBreakPoint({lsl: 1, contents: [0]}),
                             'RETURN', 'SEG_END', 'EXEC',
                             cpu.addBreakPoint(runner.baseStackConfigDiff())
                            ]).run();
                done();
            },

            'return 1': function (done) {
                var cpu = runner();
                cpu.setCode(['SEG_START', 3, 1,
                             cpu.addBreakPoint({lsl: 1, contents: [3, 1]}),
                             'RETURN', 'SEG_END', 'EXEC',
                             cpu.addBreakPoint(runner.baseStackConfigDiff(
                                 {contents: [3]}))
                            ]).run();
                done();
            },

            'return 2': function (done) {
                var cpu = runner();
                cpu.setCode(['SEG_START', 6, 3, 17, 2,
                             cpu.addBreakPoint({lsl: 1, contents: [6, 3, 17, 2]}),
                             'RETURN', 'SEG_END', 'EXEC',
                             cpu.addBreakPoint(runner.baseStackConfigDiff(
                                 {contents: [3, 17]}))
                            ]).run();
                done();
            },

            'nested invoke': function (done) {
                var cpu = runner(), x = 0;
                cpu.setCode([3, 'SEG_START', 1, 'TAKE',
                               cpu.addBreakPoint({lsl: 1, contents: [3],
                                                  post: function () { assert(x === 1); x += 1; }}),
                               6, 'SEG_START', 2, 'TAKE',
                                 cpu.addBreakPoint({lsl: 2, contents: [3, 6],
                                                    post: function () { assert(x === 2); x += 1; }}),
                                 9, 'SEG_START', 3, 'TAKE',
                                   cpu.addBreakPoint({lsl: 3, contents: [3, 6, 9],
                                                      post: function () { assert(x === 3); x += 1; }}),
                                   12, 1, 'RETURN',
                                 'SEG_END', 'EXEC',
                                 cpu.addBreakPoint({lsl: 2, contents: [12],
                                                    post: function () { assert(x === 4); x += 1; }}),
                                 15, 1, 'RETURN',
                               'SEG_END', 'EXEC',
                               cpu.addBreakPoint({lsl: 1, contents: [15],
                                                  post: function () { assert(x === 5); x += 1; }}),
                               18, 1, 'RETURN',
                             'SEG_END',
                             cpu.addBreakPoint({post: function () { assert(x === 0); x += 1; }}),
                             'EXEC',
                             cpu.addBreakPoint(runner.baseStackConfigDiff(
                                 {contents: [18], post: function () { assert(x === 6); }}))
                            ]).run();
                done();
            },

            'closure capture via return': function (done) {
                var cpu = runner();
                cpu.setCode([456, 'SEG_START', 'PUSH', 'hello',
                             'SEG_START', [1, 0], 1, 'RETURN', 'SEG_END',
                             1, 'RETURN', 'SEG_END', 'EXEC',
                             cpu.addBreakPoint(runner.baseStackConfigDiff(
                                 {contents: [456,
                                             {type: 'seg',
                                              contents: [{type: 'lexical', lsl: 1, index: 0}, 1, 'RETURN']
                                             }]})),
                             'EXEC',
                             cpu.addBreakPoint(runner.baseStackConfigDiff(
                                 {contents: [456, 'hello']}))
                            ]).run();
                done();
            },

            'closure capture via store': function (done) {
                var cpu = runner();
                cpu.setCode([456, 'SEG_START', 'PUSH', 'hello',
                             'SEG_START', [1, 0], 1, 'RETURN', 'SEG_END',
                             0, 1, 'LEXICAL_ADDRESS', 'EXCHANGE', 'STORE', 'SEG_END', 'EXEC',
                             cpu.addBreakPoint(runner.baseStackConfigDiff(
                                 {contents: [456, {type: 'seg',
                                              contents: [{type: 'lexical', lsl: 1, index: 0}, 1, 'RETURN']
                                             }]})),
                             'EXEC',
                             cpu.addBreakPoint(runner.baseStackConfigDiff(
                                 {contents: [456, 'hello']}))
                            ]).run();
                done();
            },

            'repeated closure capture via store': function (done) {
                var cpu = runner();
                cpu.setCode([456, 'SEG_START', 'PUSH', 'hello',
                             'SEG_START', 'PUSH', [1, 0], 'DUPLICATE', 'LOAD',
                             'EXCHANGE', 'PUSH', 'goodbye', 'STORE', 1, 'RETURN', 'SEG_END',
                             0, 1, 'LEXICAL_ADDRESS', 'EXCHANGE', 'STORE', 'SEG_END', 'EXEC',
                             cpu.addBreakPoint(runner.baseStackConfigDiff(
                                 {contents: [456,
                                             {type: 'seg',
                                              contents: ['PUSH', {type: 'lexical', lsl: 1, index: 0},
                                                         'DUPLICATE', 'LOAD', 'EXCHANGE',
                                                         'PUSH', 'goodbye', 'STORE', 1, 'RETURN']
                                             }]})),
                             'CLONE', 'EXEC',
                             cpu.addBreakPoint(runner.baseStackConfigDiff(
                                 {contents: [456,
                                             {type: 'seg',
                                              contents: ['PUSH', {type: 'lexical', lsl: 1, index: 0},
                                                         'DUPLICATE', 'LOAD', 'EXCHANGE',
                                                         'PUSH', 'goodbye', 'STORE', 1, 'RETURN']
                                             },
                                             'hello'
                                            ]})),
                             'POP', [0, 1],
                             cpu.addBreakPoint(runner.baseStackConfigDiff(
                                 {contents: [456,
                                             {type: 'seg',
                                              contents: ['PUSH', {type: 'lexical', lsl: 1, index: 0},
                                                         'DUPLICATE', 'LOAD', 'EXCHANGE',
                                                         'PUSH', 'goodbye', 'STORE', 1, 'RETURN']
                                             },
                                             'goodbye']})),
                             'POP', 'EXEC',
                             cpu.addBreakPoint(runner.baseStackConfigDiff({contents: [456, 'goodbye']}))
                            ]).run();
                done();
            },

            'callcc single': function (done) {
                var cpu = runner(), x = 0;
                cpu.setCode([123, 'PUSH', 'hello', 'SEG_START', 2, 'TAKE',
                               cpu.addBreakPoint(
                                   {lsl: 1,
                                    contents: ['hello', {type: 'stack', contents: [123], lsl: 0}],
                                    post: function () { assert(x === 0); x += 1; }}),
                               'PUSH', 'goodbye', 'EXCHANGE', 'EXEC',
                                cpu.addBreakPoint({lsl: 1,
                                                   contents: ['hello'],
                                                   post: function () { assert(x === 2); }}),
                             'SEG_END', 'CALLCC', 1, 'TAKE',
                             cpu.addBreakPoint({contents: [123, 'goodbye'], lsl: 0,
                                                post: function () { assert(x === 1); x += 1; }})
                            ]).run();
                done();
            },

            'callcc multiple': function (done) {
                var cpu = runner();
                cpu.setCode([123,
                             'SEG_START', 1, 'TAKE',
                               'SEG_START', 2, 'TAKE',
                                 'PUSH', 'goodbye', [2, 0],
                                 cpu.addBreakPoint({
                                     contents: [
                                         {type: 'stack', contents: [123, 'goodbye'], lsl: 0},
                                         {type: 'stack', contents: [], lsl: 1},
                                         7],
                                     lsl: 2}),
                                 'EXCHANGE', 'CALLCC', // NB suspending into a suspension!
                                 cpu.addUnreachablePoint(),
                               'SEG_END', 'CALLCC', 2, 'TAKE',
                               cpu.addBreakPoint({
                                   contents: [7,
                                              {type: 'stack', lsl: 2, contents:
                                               [{type: 'stack', contents: [123, 'goodbye'], lsl: 0}]}],
                                   dps: undef, lsl: 1}),
                             'SEG_END', 'CALLCC', 1, 'TAKE',
                             cpu.addBreakPoint({contents: [123, 'goodbye'], lsl: 0}),
                             7, 1, 'RETURN'
                            ]).run();
                done();
            },

            'callcc loop': function (done) {
                var cpu = runner(), results = [5];
                cpu.setCode(['SEG_START', 1, 'TAKE', 'DUPLICATE', 'EXEC',
                               cpu.addBreakPoint({lsl: 1, dps: undef, contents: [7, 8]}),
                               // We actually stop (eventually) here.
                             'SEG_END',
                             'CALLCC', 1, 'TAKE', 5, 'EXCHANGE',
                             // At this point, 1st time through, top
                             // of stack is the stack itself as a
                             // continuation from before the 1 TAKE.
                             'DUPLICATE', 'SEG_START', 4, 'TAKE', 'SEG_END', 'EXCHANGE',
                             // $k == the contination of ourself from after the above CALLCC
                             // $a == the segment just created. ($a' is the seg created 2nd time)
                             // 1st: 5, $k, $a, $k]; Then do the EXEC, subsequent TAKE will be a noop!
                             // 2nd: 5, $k, 5, $a, $a', $a]; Then we'll do the EXEC on $a which will
                             // wipe out the top 4, leaving just 5]
                             'EXEC',
                             cpu.addBreakPoint({contents: results, lsl: 0,
                                                post: function () { results.push(6, 7, 8); }}),
                             // EXECing a stack sets the return
                             // pointer of the newly cloned stack to
                             // the current stack. So when we first
                             // get here, the return pointer is back
                             // to the breakpoint. Hence the 6, 7, 8
                             // appearing on the stack - the 6
                             // directly and demonstrates it's the
                             // same stack, the 7, 8 via the RETURN
                             // opcode. When we get here the 2nd time,
                             // the return pointer is actually back to
                             // the inner segment, hence 7, 8 being
                             // passed up there.
                             6, 7, 8, 2, 'RETURN',
                             cpu.addUnreachablePoint()
                            ]).run();
                done();
            }
        });

    });
}(typeof define === 'function' ? define : function (factory) { module.exports = factory(); }));
