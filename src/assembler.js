(function (define) {
    define(function () {

        'use strict';

        var parser = require('./assembler-parser'),
            fs = require('fs'),
            pd = require('pretty-data').pd,
            base = {
                read: function () {
                    var r;
                    if (this.path && !this.source) {
                        r = fs.readFileSync(this.path, 'utf8');
                        if (r) {
                            this.source = r;
                        }
                    }
                    return this;
                },
                parse: function () {
                    var r;
                    if (this.source && !this.parsed) {
                        r = parser.parse(this.source);
                        if (r) {
                            this.parsed = r;
                        }
                    }
                    return this;
                },
                prettyprint: function () {
                    if (this.parsed) {
                        console.log(pd.json(JSON.stringify(this.parsed)));
                    }
                    return this;
                }
            };

        return function (path) {
            return Object.create(base, {path: {value: path}}).read().parse();
        };

    });
}(typeof define === 'function' ? define : function (factory) { module.exports = factory(); }));
