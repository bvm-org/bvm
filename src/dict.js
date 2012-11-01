(function (define) {
    define(function () {

        'use strict';

        var types = require('./types'),
            id = {},
            nuDict;

        nuDict = function (dict) {
            if (! dict) {
                dict = {};
            }
            dict = adornDictOps(dict);
            return dict;
        };
        nuDict.isDict = function (thing) {
            return thing &&
                typeof thing === 'object' &&
                id === thing.id;
        }
        return nuDict;

        function adornDictOps (dict) {
            return Object.create(
                {},
                {
                    id: {value: id},
                    has: {value: function (key) {
                        return dict.hasOwnProperty(key);
                    }},
                    keys: {value: function () { return Object.keys(dict); }},
                    load: {value: function (key) {
                        if (dict.hasOwnProperty(key)) {
                            return dict[key];
                        } else {
                            return types.undef;
                        }
                    }},
                    // TODO: dict.copy is currently deadcode. Remove later.
                    copy: {value: function (key) {
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
                        dict[key] = value;
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
