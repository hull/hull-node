import _ from "lodash";

/**
 * Returns information if the users should be sent in outgoing sync.
 * This version should filter out all users if the `synchronized_segments`
 * setting is empty
 * @param  {Object} ctx The Context Object
 * @param  {Object} user Hull user object
 * @return {Boolean}
 */
export default function filterUserSegments(ctx, user) {
  const filterSegmentIds = _.get(ctx, "ship.private_settings.synchronized_segments", []);
  return _.intersection(filterSegmentIds, user.segment_ids).length > 0;
}
