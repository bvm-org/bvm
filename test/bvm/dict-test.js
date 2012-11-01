(function (define) {
    define(function () {

        'use strict';

        var buster = require('buster'),
            fail = buster.assertions.fail,
            assert = buster.assertions.assert,
            refute = buster.assertions.refute,
            runner = require('./cpuRunner'),
            types = runner.types;

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
                             'CLONE', 'PUSH', 'e', 'EXCHANGE',
                             'DUPLICATE', 'PUSH', 'f', 'EXCHANGE',
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

            'new, store, load, keys, contains, remove': function (done) {
                var cpu = runner(done);
                cpu.setCode(['DICT_NEW',
                             cpu.addBreakPoint(runner.baseStackConfigDiff(
                                 {contents: [{type: 'dict', contents: {}}]})),
                             'PUSH', 'a', 'PUSH', 'hello', 'DICT_STORE',
                             cpu.addBreakPoint(runner.baseStackConfigDiff(
                                 {contents: [{type: 'dict', contents: {'a': 'hello'}}]})),
                             'PUSH', 'b', 17, 'DICT_STORE',
                             'PUSH', 'a', 'PUSH', 'goodbye', 'DICT_STORE',
                             cpu.addBreakPoint(runner.baseStackConfigDiff(
                                 {contents: [{type: 'dict', contents: {'a': 'goodbye',
                                                                       'b': 17}}]})),
                             'PUSH', 'b', 'DICT_LOAD',
                             cpu.addBreakPoint(runner.baseStackConfigDiff(
                                 {contents: [{type: 'dict', contents: {'a': 'goodbye',
                                                                       'b': 17}},
                                             17]})),
                             'POP', 'DICT_KEYS',
                             cpu.addBreakPoint(runner.baseStackConfigDiff(
                                 {contents: [{type: 'dict', contents: {'a': 'goodbye',
                                                                       'b': 17}},
                                             ['a', 'b']]})),
                             0, 'ARRAY_LOAD', 'EXCHANGE', 'POP', 'DICT_REMOVE',
                             cpu.addBreakPoint(runner.baseStackConfigDiff(
                                 {contents: [{type: 'dict', contents: {'b': 17}}]})),
                             'PUSH', 'c', 'DICT_REMOVE',
                             cpu.addBreakPoint(runner.baseStackConfigDiff(
                                 {contents: [{type: 'dict', contents: {'b': 17}}]})),
                             'PUSH', 'c', 'DICT_CONTAINS',
                             'EXCHANGE', 'PUSH', 'b', 'DICT_CONTAINS',
                             cpu.addBreakPoint(runner.baseStackConfigDiff(
                                 {contents: [false, {type: 'dict', contents: {'b': 17}}, true]}))
                            ]).run();
            },

            'references': function (done) {
                var cpu = runner(done);
                cpu.setCode(['DICT_NEW', 'PUSH', 'a', 7, 'DICT_STORE',
                             'CLONE', 'PUSH', 'a', 8, 'DICT_STORE',
                             'EXCHANGE', 'PUSH', 'b', 9, 'DICT_STORE',
                             cpu.addBreakPoint(runner.baseStackConfigDiff(
                                 {contents: [{type: 'dict', contents: {'a': 8}},
                                             {type: 'dict', contents: {'a': 7, 'b': 9}}]})),
                             0, 1, 'STACK_COUPLET', 'LOAD', 'PUSH', 'a', 'DICT_REMOVE',
                             cpu.addBreakPoint(runner.baseStackConfigDiff(
                                 {contents: [{type: 'dict', contents: {'a': 8}},
                                             {type: 'dict', contents: {'b': 9}},
                                             {type: 'dict', contents: {'b': 9}}]})),
                             'POP', 'DUPLICATE', 'PUSH', 'b', 10, 'DICT_STORE',
                             cpu.addBreakPoint(runner.baseStackConfigDiff(
                                 {contents: [{type: 'dict', contents: {'a': 8}},
                                             {type: 'dict', contents: {'b': 10}},
                                             {type: 'dict', contents: {'b': 10}}]})),
                             0, 0, 'STACK_COUPLET', 'DUPLICATE', 'LOAD', 'DICT_KEYS',
                             cpu.addBreakPoint(runner.baseStackConfigDiff(
                                 {contents: [{type: 'dict', contents: {'a': 8}},
                                             {type: 'dict', contents: {'b': 10}},
                                             {type: 'dict', contents: {'b': 10}},
                                             {type: 'couplet', lsl: 0, index: 0},
                                             {type: 'dict', contents: {'a': 8}},
                                             ['a']]})),
                             0, 'ARRAY_LOAD', 'EXCHANGE', 'POP', 3, -1, 'ROLL', 'LOAD', 'EXCHANGE',
                             'DICT_REMOVE',
                             cpu.addBreakPoint(runner.baseStackConfigDiff(
                                 {contents: [{type: 'dict', contents: {}},
                                             {type: 'dict', contents: {'b': 10}},
                                             {type: 'dict', contents: {'b': 10}},
                                             {type: 'dict', contents: {}},
                                             {type: 'dict', contents: {}}]})),
                            ]).run();
            },

            'current': function (done) {
                var cpu = runner(done);
                cpu.setCode(['DICT_CUR_GET',
                             'DICT_NEW',
                             cpu.addBreakPoint(runner.baseStackConfigDiff(
                                 {contents: [{type: 'dict'},
                                             {type: 'dict', contents: {}}]})),
                             'PUSH', 'a', 5, 'DICT_STORE',
                             'DICT_CUR_SET', 'PUSH', 'a', 'LOAD',
                             cpu.addBreakPoint(runner.baseStackConfigDiff(
                                 {contents: [{type: 'dict'},
                                             {type: 'dict', contents: {'a': 5}},
                                             5]})),
                             'POP', 'PUSH', 'b', 17, 'STORE',
                             cpu.addBreakPoint(runner.baseStackConfigDiff(
                                 {contents: [{type: 'dict'},
                                             {type: 'dict', contents: {'a': 5,
                                                                       'b': 17}}]})),
                             'POP', 'DICT_CUR_SET'
                            ]).run();
            }
        });
    });
}(typeof define === 'function' ? define : function (factory) { module.exports = factory(); }));
