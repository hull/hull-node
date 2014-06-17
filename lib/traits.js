"use strict";
var _ = require('underscore');

function noop () {}

function fallback (cb) {
  if (!_.isUndefined(cb) && !_.isFunction (cb)) {
    throw new Error('Callback must be a function');
  }
  return cb || noop;
}

function normalizeTraits (traits) {
  return _.reduce(traits, function (memo, v, k) {
    if (!_.isObject(v)) {
      v = {
        operation: 'set',
        value: v
      };
    }
    if (!v.operation) {
      v.operation = 'set';
    }
    memo[k] = v;
    return memo;
  }, {});
}


module.exports = {
  traits: function (traits, cb) {
    return this.put('me/traits', normalizeTraits(traits) , fallback(cb));
  }
};
