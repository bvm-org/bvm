(function (define) {
    define(function () {

        'use strict';

        var parser = require('./assembler-parser'),
            types = require('./types'),
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
                    var lsl = 0,
                        result = [],
                        labelStack = [{known: {}, unknown: {}, offset: 0}],
                        worklist, elem, tmp;
                    if (this.parsed && ! this.json) {
                        worklist = this.parsed.statements.slice(0);
                        while (worklist.length) {
                            elem = worklist.shift();
                            if (types.isRawString(elem)) {
                                // This covers general opcodes
                                if (('' + elem) === 'SEG_END') {
                                    lsl -= 1;
                                    tmp = Object.keys(labelStack.shift().unknown);
                                    if (tmp.length !== 0) {
                                        throw "Labels referenced but not declared by end of scope: " +
                                            JSON.stringify(tmp);
                                    }
                                }
                                result.push(elem);
                            } else if (typeof elem === 'number') {
                                result.push(elem);
                            } else if (typeof elem === 'object' && 'type' in elem) {
                                // This covers explicitly "double" quoted strings
                                if (elem.type === 'QuotedString') {
                                    if (('' + elem.content) === 'SEG_END') {
                                        lsl -= 1;
                                        tmp = Object.keys(labelStack.shift().unknown);
                                        if (tmp.length !== 0) {
                                            throw "Labels referenced but not declared by end of scope: " +
                                                JSON.stringify(tmp);
                                        }
                                    }
                                    result.push(elem.content);
                                } else if (elem.type === 'QuotedChar') {
                                    result.push([elem.content]);
                                } else if (elem.type === 'LexicalAddress') {
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
                                        labelStack.unshift({known: {}, unknown: {}, offset: result.length + 1});
                                    }
                                    result.push(elem.subtype + '_START');
                                    worklist.unshift(elem.subtype + '_END');
                                    worklist = elem.statements.slice(0).concat(worklist);
                                } else if (elem.type === 'PUSH') {
                                    result.push('PUSH');
                                    worklist.unshift(elem.operand);
                                } else if (elem.type === 'LabelReference') {
                                    if (elem.name in labelStack[0].known) {
                                        result.push(labelStack[0].known[elem.name]);
                                    } else {
                                        if (! (elem.name in labelStack[0].unknown)) {
                                            labelStack[0].unknown[elem.name] = [];
                                        }
                                        labelStack[0].unknown[elem.name].push(result.length);
                                        result.push('awaiting label declaration: ' + elem.name);
                                    }
                                } else if (elem.type === 'LabelDeclaration') {
                                    tmp = result.length - labelStack[0].offset;
                                    if (elem.name in labelStack[0].known) {
                                        throw "Repeated declaration of label " + elem.name;
                                    } else {
                                        labelStack[0].known[elem.name] = tmp;
                                    }
                                    if (elem.name in labelStack[0].unknown) {
                                        labelStack[0].unknown[elem.name].forEach(function (idx) {
                                            result[idx] = tmp;
                                        });
                                        delete labelStack[0].unknown[elem.name];
                                    }
                                } else {
                                    throw "Unrecognised program element: " + elem;
                                }
                            } else {
                                throw "Unrecognised program element: " + elem;
                            }
                        }
                        tmp = Object.keys(labelStack.shift().unknown);
                        if (tmp.length !== 0) {
                            throw "Labels referenced but not declared by end of scope: " +
                                JSON.stringify(tmp);
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
