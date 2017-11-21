/* @flow */
import type { THullReqContext, THullUserUpdateMessage } from "../types";

const _ = require("lodash");

/**
 * Returns information if provided notification should be sent in an outgoing sync.
 * By default it uses a setting called `synchronized_segments`. If the user belongs
 * to one of set segments the notification will be passed through.
 *
 * If the field doesn't exists it will pass all notifications, if the setting exists but it's empty
 * it will send noone.
 *
 * @param  {Object} ctx The Context Object
 * @param  {Object} notification Hull user:update notification
 * @param  {String} fieldName the name of settings name
 * @return {Boolean}
 */
module.exports = function filterNotification(ctx: THullReqContext, notification: THullUserUpdateMessage, fieldName: ?string): boolean {
  fieldName = fieldName || _.get(ctx, "connectorConfig.segmentFilterSetting");
  if (!_.has(ctx.ship.private_settings, fieldName)) {
    return true;
  }
  const filterSegmentIds = _.get(ctx.ship.private_settings, fieldName, []);

  const segments = _.get(notification, "segments", []);
  return _.intersection(filterSegmentIds, segments.map(s => s.id)).length > 0;
};
