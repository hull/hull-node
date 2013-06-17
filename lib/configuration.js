"use strict";

var _ = require('underscore'),
    defaultRequiredProps = ['appId', 'appSecret', 'orgUrl'],
    defaultConf = {},
    conf = createConf();

function checkConfiguration (obj, props) {
  props = props || defaultRequiredProps;
  props.forEach(function (p) {
    if (!obj.hasOwnProperty(p)) {
      throw new Error('The configuration is missing the required property ' + p);
    }
  });
}
checkConfiguration.defaults = Object.freeze(defaultRequiredProps);

function _extend (obj) {
  return _.extend({}, conf, obj);
}

function createConf() {
  return Object.create(defaultConf);
}

var _confGetter = function () {
  return _extend();
};

module.exports = {
  check: checkConfiguration,
  get: _confGetter,
  reset: function () {
    conf = createConf();
  },
  defaults: function (def) {
    if(!def) {
      return _confGetter();
    }
    conf = def;
    return def;
  },
  extend: _extend
};

