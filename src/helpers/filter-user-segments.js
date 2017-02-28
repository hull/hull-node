import _ from "lodash";

const fieldPath = "ship.private_settings.synchronized_segments";

/**
 * Returns information if the users should be sent in outgoing sync.
 * This version should filter out all users if the `synchronized_segments`
 * setting is empty
 * @param  {Object} ctx The Context Object
 * @param  {Object} user Hull user object
 * @return {Boolean}
 */
export default function filterUserSegments(ctx, user) {
  if (!_.has(ctx, fieldPath)) {
    return true;
  }
  const filterSegmentIds = _.get(ctx, fieldPath, []);
  return _.intersection(filterSegmentIds, user.segment_ids).length > 0;
}
