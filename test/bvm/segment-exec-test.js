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
                cpu.setCode(['SEG_START', 0, 'SEG_END', // MUST provide arity
                             cpu.addBreakPoint(runner.baseStackConfigDiff(
                                 {contents: [{type: 'seg', contents: []}]}))
                            ]).run();
            },

            'literal non-empty deferred': function (done) {
                var cpu = runner(done);
                cpu.setCode(['SEG_START', 0, 'PUSH', 'hello', 5, 'EXCHANGE', 'SEG_END',
                             cpu.addBreakPoint(runner.baseStackConfigDiff(
                                 {contents: [{type: 'seg',
                                              contents: ['PUSH', 'hello', 5, 'EXCHANGE']}]}))
                            ]).run();
            },

            'literal nested': function (done) {
                var cpu = runner(done);
                cpu.setCode(['SEG_START', 0, 'PUSH', 'outer', 5,
                             'SEG_START', 0, 'PUSH', 'inner', 6, 'SEG_END',
                             7, 'SEG_END', 15464,
                             cpu.addBreakPoint(runner.baseStackConfigDiff(
                                 {contents: [{type: 'seg', contents:
                                              ['PUSH', 'outer', 5,
                                               'SEG_START', 0, 'PUSH', 'inner', 6, 'SEG_END',
                                               7]}, 15464]}))
                            ]).run();
            },

            'enter 0-arity': function (done) {
                var cpu = runner(done), x = 0;
                cpu.setCode(['SEG_START', 0,
                             cpu.addBreakPoint({lsl: 1, contents: [],
                                                post: function () { assert(x === 1); }}),
                             'SEG_END',
                             cpu.addBreakPoint(runner.baseStackConfigDiff(
                                 {contents: [{type: 'seg', contents: [runner.breakpoint]}],
                                  post: function () { x += 1; }})),
                             'EXEC',
                             cpu.addBreakPoint(runner.baseStackConfigDiff())
                            ]).run();
            }
        });

    });
}(typeof define === 'function' ? define : function (factory) { module.exports = factory(); }));
