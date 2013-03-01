(function (define) {
    define(function () {

        'use strict';

        var repl = require('repl'),
            parseError = {},
            ev, processResult, bvmRepl, callback, undef;

        // Note a lot of the code here is to work with the badly
        // documented (and designed) NodeJS REPL module. You'll need
        // to read a lot of its code to figure out some of the
        // weirdness here.

        ev = function (cmd, context, filename, cb) {
            if (cmd.charAt(0) === '(' && cmd.charAt(cmd.length - 1) === ')') {
                cmd = cmd.substring(1, cmd.length - 2); // drop the surrounding '( and )';
            } else if ('err' in parseError) {
                delete parseError.err;
                // 2nd time here, and we errored the 1st time. Need to error again.
                cb('SyntaxError');
                return;
            }

            processResult(bvmRepl.interpret(cmd), cb);
        };

        processResult = function (result, cb) {
            if (result === parseError) {
                result = parseError.err;
                bvmRepl.interpret.log(result.toString() || '' + result);
                // strongarm the REPL modules notion of SyntaxError detection
                cb('SyntaxError');
            } else if (result === undef) {
                // must have hit a HALT opcode. Save out callback for use later on.
                callback = cb;
                bvmRepl.interpret.log("BVM Halted. Use '.resume' to resume.");
                cb(null);
            } else {
                try {
                    cb(null, JSON.stringify(result));
                } catch (errJSON) {
                    // Almost certainly just a cyclical JSON error issue.
                    bvmRepl.interpret.log('Result Display Error: ' +
                                          (errJSON && (errJSON.toString() || '' + errJSON)));
                    cb(null);
                }
            }
        };

        bvmRepl = function () {
            var r = repl.start({eval: ev, prompt: 'bvm> ', useColors: false, ignoreUndefined: true});
            r.defineCommand('resume', {
                help: 'Resume the BVM (for example after a HALT opcode)',
                action: function () {
                    processResult(bvmRepl.interpret.resume(), callback);
                }
            });
            return r;
        };

        // Doing requires in here because of the change in the context
        // - ensures we get pointer equality checks right.
        bvmRepl.interpret = function (codeStrO) {
            var nuAssembler = require('./assembler'),
                nuSegment = require('./segment'),
                nuCPU = require('./cpu'),
                assembly, cpu;

            bvmRepl.interpret = function (codeStr) {
                assembly = nuAssembler();
                assembly.source = codeStr;
                try {
                    assembly.parse().toJSON();
                } catch (err) {
                    parseError.err = err;
                    return parseError;
                }

                if (cpu !== undef) {
                    return cpu.resume(nuSegment(assembly.json));
                } else {
                    cpu = nuCPU(nuSegment(assembly.json));
                    bvmRepl.interpret.resume = function () {
                        return cpu.resume();
                    };
                    bvmRepl.interpret.log = cpu.log;
                    return cpu.boot();
                }
            };

            return bvmRepl.interpret(codeStrO);
        };

        bvmRepl.interpret.resume = function () {};
        bvmRepl.interpret.log = console.log.bind(console);

        return bvmRepl;

    });
}(typeof define === 'function' ? define : function (factory) { module.exports = factory(); }));
