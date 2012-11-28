(function (define) {
    define(function () {

        'use strict';

        var types = require('./types'),
            id = {},
            dictBase = {id: id,
                        toJSON: function () {
                            var result = {};
                            this.keys().forEach(function (key) {
                                result[key] = this.load(key);
                            }.bind(this));
                            return result;
                        }},
            undef,
            dictTemplate = {
                has:    {value: undef},
                keys:   {value: undef},
                load:   {value: undef},
                store:  {value: undef},
                remove: {value: undef},
                clone:  {value: undef}
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
                return;
            };
            dictTemplate.remove.value = function (key) {
                delete dict[key];
                return;
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
