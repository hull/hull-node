import _ from "lodash";


/**
 * Returns information if the users should be sent in outgoing sync.
 * This version should filter out all users if the `synchronized_segments`
 * setting is empty
 * @param  {Object} ctx The Context Object
 * @param  {Object} user Hull user object
 * @param  {String} fieldName the name of settings name
 * @return {Boolean}
 */
export default function filterUserSegments(ctx, user, fieldName = "synchronized_segments") {
  if (!_.has(ctx.ship.private_settings, fieldName)) {
    return true;
  }
  const filterSegmentIds = _.get(ctx.ship.private_settings, fieldName, []);
  return _.intersection(filterSegmentIds, user.segment_ids).length > 0;
}
