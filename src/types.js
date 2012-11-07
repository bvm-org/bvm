(function (define) {
    define(function () {

        'use strict';

        /* This is actually more about singletons rather than more
         * generic types.
         */

        var types = {},
            plain = {
                toString: function () {
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
            lexicalAddressBase, nuLexicalAddress, mark, undef;

        mark = Object.create(plain, {name: {value: 'mark', enumerable: true}});
        Object.defineProperty(types, 'mark', {value: mark, enumerable: true});

        undef = Object.create(plain, {name: {value: 'undef', enumerable: true}});
        Object.defineProperty(types, 'undef', {value: undef, enumerable: true});

        lexicalAddressBase = Object.create(
            plain,
            {
                id: {value: lexicalAddressId},
                name: {value: 'lexical address', enumerable: true},
                clone: {value: function () {
                    return nuLexicalAddress(this.lsl, this.index);
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
            return Object.create(
                lexicalAddressBase,
                {
                    lsl: {value: lsl},
                    index: {value: index},
                });
        };
        Object.defineProperty(types, 'nuLexicalAddress', {value: nuLexicalAddress, enumerable: true});
        Object.defineProperty(types, 'isLexicalAddress',
                              {value: function (thing) {
                                  return thing &&
                                      typeof thing === 'object' &&
                                      lexicalAddressId === thing.id;
                              }, enumerable: true});

        return types;
    });
}(typeof define === 'function' ? define : function (factory) { module.exports = factory(); }));
