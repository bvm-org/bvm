(function (define) {
    define(function () {

        'use strict';

        var buster = require('buster'),
            fail = buster.assertions.fail,
            assert = buster.assertions.assert,
            refute = buster.assertions.refute,
            bvm = require('../../bvm'),
            results = [];

        buster.testRunner.timeout = 2000; // 2 seconds

        (function () {
            var a = 0, b = 1, n = 100;
            while (n >= 0) {
                results.push(a);
                b = a + (a = b);
                n -= 1;
            }
        }());

        function runFib(body, done) {
            var n = 0, fib;
            //var start = Date.now();
            for (; n <= 100; n += 1) {
                fib = bvm.interpret('' + n + ' ' + body);
                assert(Array.isArray(fib));
                assert(fib.length === 1);
                assert(fib[0] === results[n]);
            }
            //console.log(Date.now() - start);
            done();
        }

        buster.testCase('fibonacci', {

            'recursive dfn': function (done) { runFib(
                '{ '+
                '  1 TAKE 0 1 '+
                '  { '+
                '    PUSH (-1,2) (-1,1) (-1,2) PUSH (-1,1) (-1,2) STORE ADD STORE '+
                '    PUSH (-1,0) (-1,0) DEC STORE (-1,5) '+
                '  } '+
                '  { '+
                '    (-1,1) 1 RETURN '+
                '  } '+
                '  { '+
                '    PUSH (-1,4) PUSH (-1,3) 0 (-1,0) EQ IF_ELSE '+
                '  } '+
                '  (5) '+
                '} EXEC',
                done); },

            'imperative dfn 0': function (done) { runFib(
                '{ '+
                '  1 TAKE 0 1 '+
                '  <done> (0) 0 EQ JUMP_IF '+
                '  PUSH (2) (1) (2) PUSH (1) (2) STORE ADD STORE PUSH (0) (0) DEC STORE 4 JUMP '+
                '  >done< (1) 1 RETURN '+
                '} EXEC',
                done); },

            'imperative dfn 1': function (done) { runFib(
                '{ '+
                '  1 TAKE 0 1 '+
                '  <done> (0) 0 EQ JUMP_IF '+
                '  (1) (2) ADD 3 -1 ROLL POP PUSH (0) (0) DEC STORE 4 JUMP '+
                '  >done< (1) 1 RETURN '+
                '} EXEC',
                done); },

            'imperative dfn 2': function (done) { runFib(
                '{ '+
                '  1 TAKE 0 1 '+
                '  <done> (0) 0 EQ JUMP_IF '+
                '  EXCHANGE (1) ADD PUSH (0) (0) DEC STORE 4 JUMP '+
                '  >done< (1) 1 RETURN '+
                '} EXEC',
                done); }
        });
    });
}(typeof define === 'function' ? define : function (factory) { module.exports = factory(); }));
