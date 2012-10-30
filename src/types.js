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
            pointerId = {},
            addressCoupletBase, pointerBase,
            mark, undef, nuAddressCouplet, nuPointer;

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

        pointerBase = Object.create(
            plain,
            {
                id: {value: pointerId},
                name: {value: 'pointer', enumerable: true},
                clone: {value: function () { return nuPointer(this.target); }},
                transitiveDereference: {value: function () {
                    var seen = [this], target = this.target;
                    while (types.isPointer(target)) {
                        if (-1 === seen.lastIndexOf(target)) {
                            seen.push(target);
                            target = target.target;
                        } else {
                            return undef;
                        }
                    }
                    return target;
                }}
            });
        nuPointer = function (target) {
            return Object.create(
                pointerBase,
                {
                    target: {value: target, writable: true},
                });
        };
        Object.defineProperty(types, 'nuPointer', {value: nuPointer, enumerable: true});
        Object.defineProperty(types, 'isPointer',
                              {value: function (thing) {
                                  return thing &&
                                      typeof thing === 'object' &&
                                      pointerId === thing.id;
                              }, enumerable: true});

        Object.defineProperty(types, 'isAtomString',
                              {value: function (thing) {
                                  return thing &&
                                      typeof thing === 'string';
                              }, enumerable: true});

        return types;
    });
}(typeof define === 'function' ? define : function (factory) { module.exports = factory(); }));
