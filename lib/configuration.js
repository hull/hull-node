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

function _extend (obj) {
  return _.extend({}, conf, obj);
}

function createConf() {
  return Object.create(defaultConf);
}

module.exports = {
  check: checkConfiguration,
  get: _extend.bind(undefined, {}, conf),
  reset: function () {
    conf = createConf();
  },
  defaults: function (def) {
    conf = def;
  },
  extend: _extend
};

