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
            addressCoupletId = {},
            addressCoupletBase, nuAddressCouplet, mark, undef;

        mark = Object.create(plain, {name: {value: 'mark', enumerable: true}});
        Object.defineProperty(types, 'mark', {value: mark, enumerable: true});

        undef = Object.create(plain, {name: {value: 'undef', enumerable: true}});
        Object.defineProperty(types, 'undef', {value: undef, enumerable: true});

        addressCoupletBase = Object.create(
            plain,
            {
                id: {value: addressCoupletId},
                name: {value: 'address couplet', enumerable: true},
                clone: {value: function () {
                    return nuAddressCouplet(this.lsl, this.index);
                }}
            });

        nuAddressCouplet = function (lsl, index) {
            return Object.create(
                addressCoupletBase,
                {
                    lsl: {value: lsl, writable: true},
                    index: {value: index, writable: true},
                });
        };
        Object.defineProperty(types, 'nuAddressCouplet', {value: nuAddressCouplet, enumerable: true});
        Object.defineProperty(types, 'isAddressCouplet',
                              {value: function (thing) {
                                  return thing &&
                                      typeof thing === 'object' &&
                                      addressCoupletId === thing.id;
                              }, enumerable: true});

        return types;
    });
}(typeof define === 'function' ? define : function (factory) { module.exports = factory(); }));
