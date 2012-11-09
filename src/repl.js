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
        bvmRepl.interpret = function (codeStr) {
            var nuAssembler = require('./assembler'),
                segmentTypes = require('./segment'),
                bvm = require('./bvm'),
                assembly = nuAssembler();
            assembly.source = codeStr;
            return bvm(segmentTypes.json(assembly.parse().toJSON().json)).boot();
        }

        return bvmRepl;

    });
}(typeof define === 'function' ? define : function (factory) { module.exports = factory(); }));
