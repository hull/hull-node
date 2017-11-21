/* @flow */
const _ = require("lodash");
const Promise = require("bluebird");

/**
 * @param  {Object}   req
 * @param  {Object}   res
 * @param  {Function} next
 */
module.exports = function segmentsMiddlewareFactory() {
  return function segmentsMiddleware(req: Object, res: Object, next: Function) {
    req.hull = req.hull || {};

    if (!req.hull.client) {
      return next();
    }
    const { cache, message, notification, connectorConfig } = req.hull;

    if (notification && notification.segments) {
      req.hull.segments = notification.segments;
      return next();
    }

    const bust = (message
      && (message.Subject === "users_segment:update" || message.Subject === "users_segment:delete"));

    return (() => {
      if (bust) {
        return cache.del("segments");
      }
      return Promise.resolve();
    })().then(() => {
      return cache.wrap("segments", () => {
        return req.hull.client.get("/segments", { per_page: 200 }, {
          timeout: 5000,
          retry: 1000
        });
      });
    }).then((segments) => {
      req.hull.segments = _.map(segments, (s) => {
        const fieldName = connectorConfig.segmentFilterSetting;
        const fieldPath = `ship.private_settings.${fieldName}`;
        if (_.has(req.hull, fieldPath)) {
          s.filtered = _.includes(_.get(req.hull, fieldPath, []), s.id);
        }
        return s;
      });
      return next();
    }, () => next());
  };
};
