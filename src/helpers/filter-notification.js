// /* @flow */
// import type { HullUserUpdateMessage } from "hull-client";
// import type { HullContext } from "../types";

// const _ = require("lodash");

// *
//  * Returns information if provided notification should be sent in an outgoing sync.
//  * By default it uses a setting called `synchronized_segments`. If the user belongs
//  * to one of set segments the notification will be passed through.
//  *
//  * If the field doesn't exists it will pass all notifications, if the setting exists but it's empty
//  * it will send noone.
//  *
//  * @param  {Object} ctx The Context Object
//  * @param  {Object} notification Hull user:update notification
//  * @param  {string} fieldName the name of settings name
//  * @return {boolean}

// module.exports = function filterNotification(ctx: HullContext, notification: HullUserUpdateMessage, fieldName: ?string): boolean {
//   fieldName = fieldName || _.get(ctx, "connectorConfig.segmentFilterSetting");
//   if (!_.has(ctx.ship.private_settings, fieldName)) {
//     return true;
//   }
//   const filterSegmentIds = _.get(ctx.ship.private_settings, fieldName, []);

//   const segments = _.get(notification, "segments", []);
//   return _.intersection(filterSegmentIds, segments.map(s => s.id)).length > 0;
// };
