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
            mark, undef, nuAddressCouplet, nuPointer;

        mark = Object.create(plain, {name: {value: 'mark'}});
        Object.defineProperty(types, 'mark', {value: mark, enumerable: true});

        undef = Object.create(plain, {name: {value: 'undef'}});
        Object.defineProperty(types, 'undef', {value: undef, enumerable: true});

        nuAddressCouplet = function (lsl, index) {
            return Object.create(
                plain,
                {
                    name: {value: 'address couplet'},
                    lsl: {value: lsl, writable: true},
                    index: {value: index, writable: true},
                    clone: {value: function () {
                        return nuAddressCouplet(this.lsl, this.index);
                    }}
                });
        };
        Object.defineProperty(types, 'nuAddressCouplet', {value: nuAddressCouplet, enumerable: true});
        Object.defineProperty(types, 'isAddressCouplet',
                              {value: function (thing) {
                                  return thing &&
                                      typeof thing === 'object' &&
                                      'lsl' in thing &&
                                      'index' in thing;
                              }, enumerable: true});

        nuPointer = function (target) {          // pointers are immutable so
            return Object.create(                // we don't bother overriding
                plain,                           // clone
                {
                    name: {value: 'pointer'},
                    target: {value: target},
                    asPointer: {value: function () {
                        return nuPointer(this);
                    }}
                });
        };
        Object.defineProperty(types, 'nuPointer', {value: nuPointer, enumerable: true});
        Object.defineProperty(types, 'isPointer',
                              {value: function (thing) {
                                  return thing &&
                                      typeof thing === 'object' &&
                                      'target' in thing;
                              }, enumerable: true});

        return types;
    });
}(typeof define === 'function' ? define : function (factory) { module.exports = factory(); }));
