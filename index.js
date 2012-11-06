(function (define) {
    define(function () {

        'use strict';

        var bvm = require('./src/bvm'),
            segmentTypes = require('./src/segment'),
            types = require('./src/types'),
            nuAssembler = require('./src/assembler'),
            nuRepl = require('./src/repl'),
            result = {bvm: bvm,
                      segmentTypes: segmentTypes,
                      types: types,
                      assembler: nuAssembler,
                      repl: nuRepl,
                      interpret: nuRepl.interpret
                     };

        return result;

    });
}(typeof define === 'function' ? define : function (factory) { module.exports = factory(); }));
