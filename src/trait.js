import _ from 'lodash';
module.exports = {
  normalize(traits) {
    return _.reduce(traits, (memo, value, key)=>{
      if (!_.isObject(value)) {
        value = { operation: 'set', value };
      }
      if (!value.operation) { value.operation = 'set'; }
      memo[key] = value;
      return memo;
    }, {});
  }
};