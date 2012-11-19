(function (define) {
    define(function () {

        'use strict';

        var buster = require('buster'),
            fail = buster.assertions.fail,
            assert = buster.assertions.assert,
            refute = buster.assertions.refute,
            runner = require('./cpuRunner'),
            types = runner.types;

        buster.testCase('basic stack ops', {

            'can push one': function (done) {
                var cpu = runner();
                cpu.setCode(['PUSH', 'hello',
                             cpu.addBreakPoint(runner.baseStackConfigDiff(
                                 {contents: ['hello']}))]).run();
                done();
            },

            'can push two': function (done) {
                var cpu = runner();
                cpu.setCode(['PUSH', 'hello', 'PUSH', 'goodbye',
                             cpu.addBreakPoint(runner.baseStackConfigDiff(
                                 {contents: ['hello', 'goodbye']}))]).run();
                done();
            },

            'can push three': function (done) {
                var cpu = runner();
                cpu.setCode(['PUSH', 'hello', 'PUSH', 'goodbye', 'PUSH', 7,
                             cpu.addBreakPoint(runner.baseStackConfigDiff(
                                 {contents: ['hello', 'goodbye', 7]}))]).run();
                done();
            },

            'can push implicit': function (done) {
                var cpu = runner();
                cpu.setCode([2, 'PUSH', 'goodbye', 7,
                             cpu.addBreakPoint(runner.baseStackConfigDiff(
                                 {contents: [2, 'goodbye', 7]}))]).run();
                done();
            },

            'can push and pop one': function (done) {
                var cpu = runner();
                cpu.setCode(['PUSH', 'hello',
                             cpu.addBreakPoint(runner.baseStackConfigDiff({contents: ['hello']})),
                             'POP',
                             cpu.addBreakPoint(runner.baseStackConfigDiff())]).run();
                done();
            },

            'can push and pop three': function (done) {
                var cpu = runner();
                cpu.setCode(['PUSH', 'hello', 'PUSH', 'goodbye', 17,
                             cpu.addBreakPoint(runner.baseStackConfigDiff(
                                 {contents: ['hello', 'goodbye', 17]})),
                             'POP',
                             cpu.addBreakPoint(runner.baseStackConfigDiff(
                                 {contents: ['hello', 'goodbye']})),
                             'POP',
                             cpu.addBreakPoint(runner.baseStackConfigDiff(
                                 {contents: ['hello']})),
                             'POP',
                             cpu.addBreakPoint(runner.baseStackConfigDiff())]).run();
                done();
            },

            'duplicate': function (done) {
                var cpu = runner();
                cpu.setCode([3, 8,
                             cpu.addBreakPoint(runner.baseStackConfigDiff(
                                 {contents: [3, 8]})),
                             'DUPLICATE',
                             cpu.addBreakPoint(runner.baseStackConfigDiff(
                                 {contents: [3, 8, 8]})),
                             'DUPLICATE',
                             cpu.addBreakPoint(runner.baseStackConfigDiff(
                                 {contents: [3, 8, 8, 8]}))]).run();
                done();
            },

            'count': function (done) {
                var cpu = runner();
                cpu.setCode(['COUNT',
                             cpu.addBreakPoint(runner.baseStackConfigDiff(
                                 {contents: [0]})),
                             'COUNT',
                             cpu.addBreakPoint(runner.baseStackConfigDiff(
                                 {contents: [0, 1]})),
                             'COUNT',
                             cpu.addBreakPoint(runner.baseStackConfigDiff(
                                 {contents: [0, 1, 2]}))]).run();
                done();
            },

            'exchange': function (done) {
                var cpu = runner();
                cpu.setCode([5, 'PUSH', 'hello',
                             cpu.addBreakPoint(runner.baseStackConfigDiff(
                                 {contents: [5, 'hello']})),
                             'EXCHANGE',
                             cpu.addBreakPoint(runner.baseStackConfigDiff(
                                 {contents: ['hello', 5]})),
                             3489,
                             cpu.addBreakPoint(runner.baseStackConfigDiff(
                                 {contents: ['hello', 5, 3489]})),
                             'EXCHANGE',
                             cpu.addBreakPoint(runner.baseStackConfigDiff(
                                 {contents: ['hello', 3489, 5]})),
                             'EXCHANGE', 'EXCHANGE',
                             cpu.addBreakPoint(runner.baseStackConfigDiff(
                                 {contents: ['hello', 3489, 5]}))]).run();
                done();
            },

            'copy': function (done) {
                var cpu = runner();
                cpu.setCode([5, 'PUSH', 'hello', 1, 'COPY',
                             cpu.addBreakPoint(runner.baseStackConfigDiff(
                                 {contents: [5, 'hello', 'hello']})),
                             3, 'COPY',
                             cpu.addBreakPoint(runner.baseStackConfigDiff(
                                 {contents: [5, 'hello', 'hello', 5, 'hello', 'hello']})),
                             7, 2, 'COPY',
                             cpu.addBreakPoint(runner.baseStackConfigDiff(
                                 {contents: [5, 'hello', 'hello', 5, 'hello', 'hello', 7, 'hello', 7]}))
                            ]).run();
                done();
            },

            'index': function (done) {
                var cpu = runner();
                cpu.setCode([5, 0, 'INDEX',
                             cpu.addBreakPoint(runner.baseStackConfigDiff(
                                 {contents: [5, 5]})),
                             3, 2, 0, 'INDEX',
                             cpu.addBreakPoint(runner.baseStackConfigDiff(
                                 {contents: [5, 5, 3, 2, 2]})),
                             2, 'INDEX',
                             cpu.addBreakPoint(runner.baseStackConfigDiff(
                                 {contents: [5, 5, 3, 2, 2, 3]}))
                            ]).run();
                done();
            },

            'roll': function (done) {
                var cpu = runner();
                cpu.setCode(['PUSH', 'a', 'PUSH', 'b', 'PUSH', 'c', 'PUSH', 'd',
                             3, 0, 'ROLL',
                             cpu.addBreakPoint(runner.baseStackConfigDiff(
                                 {contents: ['a', 'b', 'c', 'd']})),
                             3, 1, 'ROLL',
                             cpu.addBreakPoint(runner.baseStackConfigDiff(
                                 {contents: ['a', 'd', 'b', 'c']})),
                             3, 1, 'ROLL',
                             cpu.addBreakPoint(runner.baseStackConfigDiff(
                                 {contents: ['a', 'c', 'd', 'b']})),
                             3, 4, 'ROLL',
                             cpu.addBreakPoint(runner.baseStackConfigDiff(
                                 {contents: ['a', 'b', 'c', 'd']})),
                             3, -1, 'ROLL',
                             cpu.addBreakPoint(runner.baseStackConfigDiff(
                                 {contents: ['a', 'c', 'd', 'b']})),
                             3, -1, 'ROLL',
                             cpu.addBreakPoint(runner.baseStackConfigDiff(
                                 {contents: ['a', 'd', 'b', 'c']})),
                             3, -7, 'ROLL',
                             cpu.addBreakPoint(runner.baseStackConfigDiff(
                                 {contents: ['a', 'b', 'c', 'd']})),
                             3, 9, 'ROLL',
                             cpu.addBreakPoint(runner.baseStackConfigDiff(
                                 {contents: ['a', 'b', 'c', 'd']})),
                             3, -27, 'ROLL',
                             cpu.addBreakPoint(runner.baseStackConfigDiff(
                                 {contents: ['a', 'b', 'c', 'd']})),
                            ]).run();
                done();
            },

            'clone, duplicate': function (done) {
                var cpu = runner();
                cpu.setCode(['ARRAY_NEW', 'CLONE', 'DUPLICATE',
                             'DICT_NEW', 'CLONE', 'DUPLICATE',
                             'SEG_START', 'SEG_END', 'CLONE', 'DUPLICATE',
                             0, 0, 'LEXICAL_ADDRESS', 'CLONE', 'DUPLICATE',
                             5, 'CLONE', 'DUPLICATE',
                             'PUSH', new String('a'), 'CLONE', 'DUPLICATE',
                             'PUSH', 'hello', 'CLONE', 'DUPLICATE',
                             'TRUE', 'CLONE', 'DUPLICATE',
                             'UNDEF', 'CLONE', 'DUPLICATE',
                             'MARK', 'CLONE', 'DUPLICATE',
                             cpu.addBreakPoint(runner.baseStackConfigDiff(
                                 {contents: [[], [], [],
                                             {type: 'dict', contents: {}},
                                             {type: 'dict', contents: {}},
                                             {type: 'dict', contents: {}},
                                             {type: 'seg', contents: []},
                                             {type: 'seg', contents: []},
                                             {type: 'seg', contents: []},
                                             {type: 'lexical', lsl: 0, index: 0},
                                             {type: 'lexical', lsl: 0, index: 0},
                                             {type: 'lexical', lsl: 0, index: 0},
                                             5, 5, 5,
                                             new String('a'), 'a', new String('a'),
                                             'hello', 'hello', 'hello',
                                             true, true, true,
                                             types.undef, types.undef, types.undef,
                                             types.mark, types.mark, types.mark
                                            ],
                                  post: function (stack) {
                                      var idx = 0, len = stack.length();
                                      for (; idx < len; idx += 3) {
                                          assert(stack.index(idx) !== stack.index(idx+1) ||
                                                 idx >= 9);
                                          assert(stack.index(idx+1) === stack.index(idx+2));
                                      }
                                  }}))
                            ]).run();
                done();
            },

            'clear': function (done) {
                var cpu = runner();
                cpu.setCode([4, 3, 2, 1, 'COUNT',
                             cpu.addBreakPoint(runner.baseStackConfigDiff(
                                 {contents: [4, 3, 2, 1, 4]})),
                             'CLEAR',
                             cpu.addBreakPoint(runner.baseStackConfigDiff())
                            ]).run();
                done();
            }

        });

    });
}(typeof define === 'function' ? define : function (factory) { module.exports = factory(); }));
