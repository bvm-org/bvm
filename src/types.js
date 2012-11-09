(function (define) {
    define(function () {

        'use strict';

        /* This is actually more about singletons rather than more
         * generic types.
         */

        var types = {},
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
                lsl: {value: 0},
                index: {value: 0}
            },
            lexicalAddressBase, nuLexicalAddress, mark, undef;

        mark = Object.create(plain, {name: {value: 'mark'}});
        Object.defineProperty(types, 'mark', {value: mark});

        undef = Object.create(plain, {name: {value: 'undef'}});
        Object.defineProperty(types, 'undef', {value: undef});

        lexicalAddressBase = Object.create(
            plain,
            {
                id: {value: lexicalAddressId},
                toJSON: {value: function () {
                    return {type: 'lexical address',
                            lsl: this.lsl,
                            index: this.index};
                }},
                transitiveDereference: {value: function (vcpu) {
                    var seen = {}, obj = this;
                    seen[obj.lsl] = {};
                    seen[obj.lsl][obj.index] = true;
                    while (true) {
                        obj = vcpu.dereferenceScope(obj.lsl).index(obj.index);
                        if (types.isLexicalAddress(obj)) {
                            if (seen[obj.lsl] && seen[obj.lsl][obj.index]) {
                                throw "CYCLICAL LEXICAL ADDRESSES"; // TODO interrupt handler
                            } else {
                                (seen[obj.lsl] ? seen[obj.lsl] : seen[obj.lsl] = {})[obj.index] = true;
                            }
                        } else {
                            return obj;
                        }
                    }
                }}
            });

        nuLexicalAddress = function (lsl, index) {
            lexicalAddressTemplate.lsl.value = lsl;
            lexicalAddressTemplate.index.value = index;
            return Object.create(lexicalAddressBase, lexicalAddressTemplate);
        };
        Object.defineProperty(types, 'nuLexicalAddress', {value: nuLexicalAddress});
        Object.defineProperty(types, 'isLexicalAddress',
                              {value: function (thing) {
                                  return thing &&
                                      typeof thing === 'object' &&
                                      lexicalAddressId === thing.id;
                              }});

        return types;
    });
}(typeof define === 'function' ? define : function (factory) { module.exports = factory(); }));
