(function (define) {
    define(function () {

        'use strict';

        /* This is actually more about singletons rather than more
         * generic types.
         */

        var types = {}, undef,
            plain = {
                toJSON: function () {
                    if ('name' in this) {
                        return '' + this.name;
                    } else {
                        return 'unknown';
                    }
                },
                clone: function () {
                    return this; // assume singleton by default
                }
            },
            lexicalAddressId = {},
            lexicalAddressTemplate = {
                lsl:   {value: 0},
                index: {value: 0},
            },
            fixedLexicalAddressTemplate = {
                ls:    {value: undef},
                fix:   {value: function () { return this; }}
            },
            lexicalAddressBase,
            chId = {},
            chBase,
            chTemplate = {
                ch: {value: undef}
            },
            toString = Object.prototype.toString,
            nuError = require('./errors');

        Object.defineProperty(types, 'mark', {value: Object.create(plain, {name: {value: 'mark'}})});
        Object.defineProperty(types, 'undef', {value: Object.create(plain, {name: {value: 'undef'}})});

        lexicalAddressBase = Object.create(
            plain,
            {
                id: {value: lexicalAddressId},
                toJSON: {value: function () {
                    return {type: 'lexical address',
                            lsl: this.lsl,
                            index: this.index};
                }},
                fix: {value: function (vcpu) {
                    fixedLexicalAddressTemplate.ls.value = vcpu.dereferenceScope(this.lsl);
                    return Object.create(this, fixedLexicalAddressTemplate);
                }},
                transitiveDereference: {value: function (vcpu) {
                    var seen = {}, obj = this.fix();
                    seen[obj.lsl] = {};
                    seen[obj.lsl][obj.index] = true;
                    while (true) {
                        obj = obj.ls.index(obj.index);
                        if (types.isLexicalAddress(obj)) {
                            if (seen[obj.lsl] && seen[obj.lsl][obj.index]) {
                                nuError('CYCLICAL LEXICAL ADDRESSES', this);
                            } else {
                                (seen[obj.lsl] ? seen[obj.lsl] : seen[obj.lsl] = {})[obj.index] = true;
                            }
                        } else {
                            return obj;
                        }
                    }
                }}
            });

        Object.defineProperty(types, 'nuLexicalAddress', {value: function (lsl, index) {
            lexicalAddressTemplate.lsl.value = lsl;
            lexicalAddressTemplate.index.value = index;
            return Object.create(lexicalAddressBase, lexicalAddressTemplate);
        }});
        Object.defineProperty(types, 'isLexicalAddress',
                              {value: function (thing) {
                                  return thing &&
                                      typeof thing === 'object' &&
                                      lexicalAddressId === thing.id;
                              }});

        chBase = Object.create(
            plain,
            {
                id: {value: chId},
                toJSON: {value: function () {
                    return {type: 'character',
                            character: this.ch};
                }}
            });

        Object.defineProperty(types, 'nuChar', {value: function (ch) {
            chTemplate.ch.value = ch;
            return Object.create(chBase, chTemplate);
        }});
        Object.defineProperty(types, 'isChar', {value: function (thing) {
            return thing && typeof thing === 'object' &&
                chId === thing.id;
        }});

        Object.defineProperty(types, 'isString', {value: function (thing) {
            return (typeof thing === 'string') ||
                (typeof thing === 'object' &&
                 toString.call(thing) === '[object String]');
        }});

        return types;
    });
}(typeof define === 'function' ? define : function (factory) { module.exports = factory(); }));
