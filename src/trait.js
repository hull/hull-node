import mapper from 'object-mapper';
import _ from 'lodash';

// var user = {
//   'email': 'romain@user',
//   'name': 'name',
//   'traits_coconut_name': 'coconut',
//   'traits_coconut_size': 'large',
//   'traits_cb/twitter_bio': 'parisian',
//   'traits_cb/twitter_name': 'parisian',
//   'traits_group/name': 'groupname',
//   'traits_zendesk/open_tickets': 18
// };
/* first build the destination object from the key names of the source object */

function buildMap(user) {
  return _.reduce(user, (m, value, key)=>{
    if ( key.match(/^traits_/) ) {
      let dest = key;
      if ( key.match(/\//) ) {
        dest = key.replace(/^traits_/, '').replace(/\//g, '.');
      } else {
        dest = key.replace(/^traits_/, 'traits.');
      }
      m[key] = dest;
    } else {
      m[key] = key;
    }
    return m;
  }, {});
}

module.exports = {
  group(user) {
    return mapper.merge(user, {}, buildMap(user));
  },
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
