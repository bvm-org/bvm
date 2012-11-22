(function (define) {
    define(function () {

        'use strict';

        var fs = require('fs'),
            path = require('path');

        return function (vcpu, ops) {
            var opsDir = path.join(__dirname, 'ops'), opsObj, fun;
            fs.readdirSync(opsDir).forEach(function (opFile) {
                if (path.extname(opFile) in require.extensions) {
                    opsObj = require(path.join(opsDir, opFile))(vcpu);
                    Object.keys(opsObj).forEach(function (key) {
                        fun = opsObj[key].bind(ops);
                        fun.opCodeName = key;
                        fun.toJSON = function () { return key + '!'; };
                        opsObj[key] = { configurable: false,
                                        writable: false,
                                        enumerable: true,
                                        value: fun
                                      };
                    });
                    Object.defineProperties(ops, opsObj);
                }
            });
        }

    });
}(typeof define === 'function' ? define : function (factory) { module.exports = factory(); }));
