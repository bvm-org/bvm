(function (define) {
    define(function () {

        'use strict';

        var types = require('./types'),
            id = {},
            dictBase = {id: id},
            nuDict;

        nuDict = function (dict) {
            if (! dict) {
                dict = {};
            }
            return adornDictOps(dict);
        };
        nuDict.isDict = function (thing) {
            return thing &&
                typeof thing === 'object' &&
                id === thing.id;
        }
        return nuDict;

        function adornDictOps (dict) {
            return Object.create(
                dictBase,
                {
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
