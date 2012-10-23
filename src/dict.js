(function (define) {
    define(function () {

        'use strict';

        var types = require('./types');

        return function nuDict (dict) {
            if (! dict) {
                dict = {};
            }
            dict = adornDictOps(dict);
            return dict;
        };

        function adornDictOps (dict) {
            return Object.create(
                {},
                {
                    has: {value: function (key) {
                        return dict.hasOwnProperty(key);
                    }},
                    load: {value: function (key) {
                        var val;
                        if (dict.hasOwnProperty(key)) {
                            val = dict[key];
                            if (typeof val === 'number' ||
                                typeof val === 'string' ||
                                typeof val === 'boolean') {
                                return val;
                            } else {
                                if ('clone' in val && typeof val.clone === 'function') {
                                    return val.clone();
                                } else {
                                    throw "UNABLE TO CLONE VALUE";
                                }
                            }
                        } else {
                            return undefined;
                        }
                    }},
                    store: {value: function (key, value) {
                        if (value === undefined || value === null || value === types.undef) {
                            delete dict[key];
                        } else {
                            dict[key] = value;
                        }
                        return undefined;
                    }},
                    remove: {value: function (key) {
                        delete dict[key];
                        return undefined;
                    }},
                    clone: {value: function () {
                        var d = {};
                        Object.keys(dict).forEach(function (key) {
                            d[key] = dict[key];
                        });
                        return nuDict(d);
                    }}
                });
        }


    });
}(typeof define === 'function' ? define : function (factory) { module.exports = factory(); }));
