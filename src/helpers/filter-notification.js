import _ from "lodash";


/**
 * Returns information if the users should be sent in outgoing sync.
 * This version should filter out all users if the `synchronized_segments`
 * setting is empty
 * @param  {Object} ctx The Context Object
 * @param  {Object} notification Hull user:update notification
 * @param  {String} fieldName the name of settings name
 * @return {Boolean}
 */
export default function filterNotification(ctx, notification, fieldName = "synchronized_segments") {
  if (!_.has(ctx.ship.private_settings, fieldName)) {
    return true;
  }
  const filterSegmentIds = _.get(ctx.ship.private_settings, fieldName, []);

  const segments = _.uniq(_.concat(notification.segments || [], _.get(notification, "changes.segments.left", [])));
  return _.intersection(filterSegmentIds, segments.map(s => s.id)).length > 0;
}
