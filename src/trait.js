import mapper from "object-mapper";
import _ from "lodash";
import { escape, unescape } from "querystring" ;
// var user = {
//   "email": "romain@user",
//   "name": "name",
//   "traits_coconut_name": "coconut",
//   "traits_coconut_size": "large",
//   "traits_cb/twitter_bio": "parisian",
//   "traits_cb/twitter_name": "parisian",
//   "traits_group/name": "groupname",
//   "traits_zendesk/open_tickets": 18
// };
/* first build the destination object from the key names of the source object */

module.exports = {

  group(user) {
    return _.reduce(user, (grouped, value, key) => {
      let dest = key
      if (key.match(/^traits_/)) {
        if (key.match(/\//)) {
          dest = key.replace(/^traits_/, "");
        } else {
          dest = key.replace(/^traits_/, "traits/");
        }
      }
      return _.set(grouped, dest.split('/'), value);
    }, {});
  },

  normalize(traits) {
    return _.reduce(traits, (memo, value, key) => {
      if (!_.isObject(value)) {
        value = { operation: "set", value };
      }
      if (!value.operation) { value.operation = "set"; }
      memo[key] = value;
      return memo;
    }, {});
  }
};
