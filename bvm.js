(function (define) {
    define(function () {

        'use strict';

        var nuCPU = require('./src/cpu'),
            nuSegment = require('./src/segment'),
            types = require('./src/types'),
            nuAssembler = require('./src/assembler'),
            result = {nuCPU: nuCPU,
                      nuSegment: nuSegment,
                      types: types,
                      assembler: nuAssembler,
                      interpret: function (codeStr) {
                          var assembly = nuAssembler();
                          assembly.source = codeStr;
                          return nuCPU(nuSegment(assembly.parse().toJSON().json));
                      },
                      interpretJSON: function (json) {
                          return nuCPU(nuSegment(json));
                      }
                     };

        try {
            result.repl = require('./src/repl');
        } catch (e) {
            // probably in the browser
        }

        return result;

    });
}(typeof define === 'function' ? define : function (factory) { module.exports = factory(); }));
