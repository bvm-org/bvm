(function (define) {
    define(function () {

        'use strict';

        var bvm = require('./src/bvm'),
            segmentTypes = require('./src/segment'),
            types = require('./src/types'),
            result = {bvm: bvm,
                      segmentTypes: segmentTypes,
                      types: types};

        return result;

    });
}(typeof define === 'function' ? define : function (factory) { module.exports = factory(); }));
