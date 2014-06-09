var _ = require('underscore');

function noop () {}

function fallback (cb) {
  if (!_.isUndefined(cb) && !_.isFunction (cb)) {
    throw new Error('Callback must be a function');
  }
  return cb || noop;
}

function Trait (client, name, value, cb) {
  if (!_.isString(name)) {
    throw new Error('You must provide a name to the trait');
  }
  this.name = name;
  this.client = client || function () {};
  if (!_.isUndefined(value)) {
    this.set(value, cb);
  }
}

var applyTrait = function (op, value, cb) {
  cb = fallback(cb);
  this.client.put('me/traits', {
    name: this.name,
    operation: op,
    value: value
  }, cb);
  return this;
};

//Add basic operations
_.each(['inc', 'dec', 'set'], function (op) {
  Trait.prototype[op] = _.partial(applyTrait, op);
});


module.exports = {
  trait: function (name, value, cb) {
    return new Trait(this, name, value, cb);
  },
  traits: function (traits, cb) {
    return this.put('me/traits', { value: traits }, fallback(cb));
  }
};
