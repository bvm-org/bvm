(function (define) {
    define(function () {

        'use strict';

        var types = require('./types'),
            id = {},
            dictBase = {id: id},
            dictTemplate = {
                has:    {value: undefined},
                keys:   {value: undefined},
                load:   {value: undefined},
                store:  {value: undefined},
                remove: {value: undefined},
                clone:  {value: undefined}
            },
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
            dictTemplate.has.value = Object.prototype.hasOwnProperty.bind(dict);
            dictTemplate.keys.value = function () { return Object.keys(dict); };
            dictTemplate.load.value = function (key) {
                if (dict.hasOwnProperty(key)) {
                    return dict[key];
                } else {
                    return types.undef;
                }
            };
            dictTemplate.store.value = function (key, value) {
                dict[key] = value;
                return undefined;
            };
            dictTemplate.remove.value = function (key) {
                delete dict[key];
                return undefined;
            };
            dictTemplate.clone.value = function () {
                var d = {};
                Object.keys(dict).forEach(function (key) {
                    d[key] = dict[key];
                });
                return nuDict(d);
            };
            return Object.create(dictBase, dictTemplate);
        }


    });
}(typeof define === 'function' ? define : function (factory) { module.exports = factory(); }));
