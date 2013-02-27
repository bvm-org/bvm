(function (define) {
    define(function () {

        'use strict';

        var fs = require('fs'),
            path = require('path'),
            assembler = require('./assembler'),
            nuSegment = require('./segment'),
            preludeDir = path.join(__dirname, '..', 'prelude');

        return function (vcpu) {
            var prelude = [], ext;
            fs.readdirSync(preludeDir).sort().forEach(function (preludeFile) {
                ext = path.extname(preludeFile);
                if (ext === '.json') {
                    prelude.push(nuSegment(
                        fs.readFileSync(path.join(preludeDir, preludeFile), 'utf8')));
                } else if (ext === '.bvm') {
                    prelude.push(nuSegment(
                        assembler(path.join(preludeDir, preludeFile)).read().parse().toJSON().json));
                }
            });
            prelude.forEach(function (segment) {
                vcpu.enterSegment(segment);
                vcpu.run();
            });
        };

    });
}(typeof define === 'function' ? define : function (factory) { module.exports = factory(); }));
