// @flow
import _ from "lodash";

module.exports = {

  group(user: Object): Object {
    return _.reduce(user, (grouped, value, key) => {
      let dest = key;
      if (key.match(/^traits_/)) {
        if (key.match(/\//)) {
          dest = key.replace(/^traits_/, "");
        } else {
          dest = key.replace(/^traits_/, "traits/");
        }
      }
      return _.setWith(grouped, dest.split("/"), value, Object);
    }, {});
  },

  normalize(traits: Object): Object {
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
