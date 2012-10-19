(function (define) {
    define(function () {

        'use strict';

        /* This is actually more about singletons rather than more
         * generic types.
         */

        var types = {},
            plain = {executable: false,
                     toString: function () {
                         if ('name' in this) {
                             return '' + this.name;
                         } else {
                             return 'unknown';
                         }
                     }},
            mark, undef;

        mark = Object.create(plain, {name: {value: 'mark'}});
        Object.defineProperty(types, 'mark', {value: mark, enumerable: true});

        undef = Object.create(plain, {name: {value: 'undef'}});
        Object.defineProperty(types, 'undef', {value: undef, enumerable: true});

        return types;
    });
}(typeof define === 'function' ? define : function (factory) { module.exports = factory(); }));
