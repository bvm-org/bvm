(function (define) {
    define(function () {

        'use strict';

        var repl = require('repl'),
            e, i, bvmRepl;

        e = function (cmd, context, filename, callback) {
            cmd = cmd.substring(1, cmd.length - 2); // drop the surrounding '( and )';
            try {
                callback(null, JSON.stringify(bvmRepl.interpret(cmd)));
            } catch (e) {
                // Temp fix because syntax errors are getting lost /
                // wrecked by the repl
                callback(null, 'Error: ' + (e && (e.toString() || '' + e)));
            }
        };

        bvmRepl = function () {
            return repl.start({eval: e, prompt: 'bvm> ', useColors: false});
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
                assembly.parse().toJSON();

                if (cpu) {
                    return cpu.resume(nuSegment(assembly.json));
                } else {
                    cpu = nuCPU(nuSegment(assembly.json));
                    return cpu.boot();
                }
            };

            return bvmRepl.interpret(codeStrO);
        };

        return bvmRepl;

    });
}(typeof define === 'function' ? define : function (factory) { module.exports = factory(); }));
