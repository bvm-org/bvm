(function (define) {
    define(function () {

        'use strict';

        var bvm = require('./src/cpu'),
            segmentTypes = require('./src/segment'),
            types = require('./src/types'),
            nuAssembler = require('./src/assembler'),
            result = {bvm: bvm,
                      segmentTypes: segmentTypes,
                      types: types,
                      assembler: nuAssembler,
                      interpret: function (codeStr) {
                          var assembly = nuAssembler();
                          assembly.source = codeStr;
                          return bvm(segmentTypes.json(assembly.parse().toJSON().json)).boot();
                      }
                     };

        return result;
    });
}(typeof define === 'function' ? define : function (factory) { module.exports = factory(); }));
