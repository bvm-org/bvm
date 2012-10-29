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

        buster.testCase('dict ops', {
            'literal empty': function (done) {
                var cpu = runner(done);
                cpu.setCode(['DICT_START', 'DICT_END',
                             cpu.addBreakPoint(runner.baseStackConfigDiff(
                                 {contents: [{type: 'dict', contents: {}}]}))]).run();
            },

            'literal non-empty non-deferred': function (done) {
                var cpu = runner(done);
                cpu.setCode(['DICT_START', 'PUSH', 'a', 5, 7, 'POP', 76, 'PUSH', 'b', 'EXCHANGE', 'DICT_END',
                             cpu.addBreakPoint(runner.baseStackConfigDiff(
                                 {contents: [{type: 'dict', contents: {'a': 5, 'b': 76}}]}))]).run();
            },

            'literal nested': function (done) {
                var cpu = runner(done);
                cpu.setCode(['DICT_START', 'PUSH', 'a', 5, 'PUSH', 'b',
                             'DICT_START', 'PUSH', 'c', 'PUSH', 'd', 2, 'COPY', 'EXCHANGE', 'DICT_END',
                             'DUPLICATE', 'PUSH', 'e', 'EXCHANGE',
                             'ADDRESS', 'DUPLICATE', 'LOAD', 'EXCHANGE', 'LOAD', 'PUSH', 'f', 'EXCHANGE',
                             'DICT_END',
                             cpu.addBreakPoint(runner.baseStackConfigDiff(
                                 {contents: [{type: 'dict', contents: {
                                     'a': 5,
                                     'b': {type: 'dict', contents: {
                                         'c': 'd',
                                         'd': 'c'}},
                                     'e': {type: 'dict', contents: {
                                         'c': 'd',
                                         'd': 'c'}},
                                     'f': {type: 'dict', contents: {
                                         'c': 'd',
                                         'd': 'c'}}}}],
                                  post: function (stack) {
                                      var dict = stack.index(0);
                                      assert(dict.load('b') !== dict.load('e'));
                                      assert(dict.load('e') === dict.load('f'));
                                  }}))]).run();
            },

            'new, store, load, keys, has, remove': function (done) {
                var cpu = runner(done);
                cpu.setCode(['DICT_NEW',
                             cpu.addBreakPoint(runner.baseStackConfigDiff(
                                 {contents: [{type: 'dict', contents: {}}]})),
                             'ADDRESS', 'DUPLICATE', 'LOAD', 'PUSH', 'a', 'PUSH', 'hello', 'DICT_STORE',
                             cpu.addBreakPoint(runner.baseStackConfigDiff(
                                 {contents: [{type: 'ptr', target:
                                              {type: 'dict', contents: {'a': 'hello'}}}]})),
                             'DUPLICATE', 'LOAD', 'PUSH', 'b', 17, 'DICT_STORE',
                             'DUPLICATE', 'LOAD', 'PUSH', 'a', 'PUSH', 'goodbye', 'DICT_STORE',
                             cpu.addBreakPoint(runner.baseStackConfigDiff(
                                 {contents: [{type: 'ptr', target:
                                              {type: 'dict', contents: {'a': 'goodbye',
                                                                        'b': 17}}}]})),
                             'DUPLICATE', 'LOAD', 'PUSH', 'b', 'DICT_LOAD',
                             cpu.addBreakPoint(runner.baseStackConfigDiff(
                                 {contents: [{type: 'ptr', target:
                                              {type: 'dict', contents: {'a': 'goodbye',
                                                                        'b': 17}}},
                                             17]})),
                             'POP', 'DUPLICATE', 'LOAD', 'DICT_KEYS',
                             cpu.addBreakPoint(runner.baseStackConfigDiff(
                                 {contents: [{type: 'ptr', target:
                                              {type: 'dict', contents: {'a': 'goodbye',
                                                                        'b': 17}}},
                                             ['a', 'b']]})),
                             0, 'ARRAY_LOAD', 'EXCHANGE', 'DUPLICATE', 'LOAD', 3, -1, 'ROLL',
                             'DICT_REMOVE',
                             cpu.addBreakPoint(runner.baseStackConfigDiff(
                                 {contents: [{type: 'ptr', target:
                                              {type: 'dict', contents: {'b': 17}}}]})),
                             'DUPLICATE', 'LOAD', 'PUSH', 'c', 'DICT_REMOVE',
                             cpu.addBreakPoint(runner.baseStackConfigDiff(
                                 {contents: [{type: 'ptr', target:
                                              {type: 'dict', contents: {'b': 17}}}]})),
                             'DUPLICATE', 'LOAD', 'PUSH', 'c', 'DICT_CONTAINS',
                             'EXCHANGE', 'LOAD', 'PUSH', 'b', 'DICT_CONTAINS',
                             cpu.addBreakPoint(runner.baseStackConfigDiff(
                                 {contents: [false, true]}))

                             ]).run();
            },

            'current': function (done) {
                var cpu = runner(done);
                cpu.setCode(['DICT_CUR_GET',
                             'DICT_NEW',
                             cpu.addBreakPoint(runner.baseStackConfigDiff(
                                 {contents: [{type: 'dict'},
                                             {type: 'dict', contents: {}}]})),
                             'ADDRESS', 'DUPLICATE', 'LOAD', 'PUSH', 'a', 5, 'DICT_STORE',
                             'DUPLICATE', 'LOAD', 'DICT_CUR_SET', 'PUSH', 'a', 'LOAD',
                             cpu.addBreakPoint(runner.baseStackConfigDiff(
                                 {contents: [{type: 'dict'},
                                             {type: 'ptr',
                                              target: {type: 'dict', contents: {'a': 5}}},
                                             5]})),
                             'POP', 'PUSH', 'b', 17, 'STORE',
                             cpu.addBreakPoint(runner.baseStackConfigDiff(
                                 {contents: [{type: 'dict'},
                                             {type: 'ptr',
                                              target: {type: 'dict', contents: {'a': 5,
                                                                                'b': 17}}}]})),
                             'POP', 'DICT_CUR_SET'
                            ]).run();
            }
        });
    });
}(typeof define === 'function' ? define : function (factory) { module.exports = factory(); }));
