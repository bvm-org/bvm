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
                },
                toJSON: function () {
                    var lsl = 0, result = [], worklist, elem, tmp;
                    if (this.parsed && ! this.json) {
                        worklist = this.parsed.statements.slice(0);
                        while (worklist.length) {
                            elem = worklist.shift();
                            if (typeof elem === 'string') {
                                if (elem === 'SEG_END') {
                                    lsl -= 1;
                                }
                                result.push(elem);
                            } else if (typeof elem === 'number') {
                                result.push(elem);
                            } else if (typeof elem === 'object' && 'type' in elem) {
                                if (elem.type === 'LexicalAddress') {
                                    if ('lsl' in elem) {
                                        tmp = elem.lsl < 0 ? lsl + elem.lsl : elem.lsl;
                                        if (tmp < 0) {
                                            throw "Invalid lexical scope indicator: " + tmp;
                                        }
                                    } else {
                                        tmp = lsl;
                                    }
                                    result.push([tmp, elem.index]);
                                } else if (elem.type === 'Section') {
                                    if (elem.subtype === 'SEG') {
                                        lsl += 1;
                                    }
                                    result.push(elem.subtype + '_START');
                                    worklist.unshift(elem.subtype + '_END');
                                    worklist = elem.statements.slice(0).concat(worklist)
                                }
                            } else {
                                throw "Unrecognised program element: " + elem;
                            }
                        }
                        this.json = result;
                    }
                    return this;
                }
            };

        return function (path) {
            return Object.create(base, {path: {value: path}});
        };

    });
}(typeof define === 'function' ? define : function (factory) { module.exports = factory(); }));
