import _ from "lodash";
/**
 * @param  {Object} ctx The Context Object
 * @return {Object}
 */
export default function getSettings(ctx) {
  return _.get(ctx.ship, "private_settings", {});
}
