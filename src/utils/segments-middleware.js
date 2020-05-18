/* @flow */
const _ = require("lodash");
const Promise = require("bluebird");

function fetchSegments(client, entityType = "users") {
  const { id } = client.configuration();
  return client.get(
    `/${entityType}_segments`,
    { shipId: id },
    {
      timeout: 5000,
      retry: 1000
    }
  );
}

/**
 * @return {Function} middleware
 */
module.exports = function segmentsMiddlewareFactory() {
  return function segmentsMiddleware(req: Object, res: Object, next: Function) {
    const hull = req.hull || {};

    if (!hull.client) {
      return next();
    }
    const { workspaceCache: cache, message, notification, connectorConfig } = hull;

    if (notification && notification.segments) {
      hull.segments = notification.segments;
      return next();
    }

    const bust =
      message && message.Subject && message.Subject.includes("segment");

    return (() => {
      if (bust) {
        return cache.del("segments");
      }
      return Promise.resolve();
    })()
      .then(() =>
        cache.wrap("segments", () =>
          Promise.all([
            fetchSegments(hull.client, "users"),
            fetchSegments(hull.client, "accounts")
          ])
        )
      )
      .then(
        ([users_segments, accounts_segments]) => {
          hull.users_segments = _.map(users_segments, (segment) => {
            const fieldName = connectorConfig.segmentFilterSetting;
            const fieldPath = `ship.private_settings.${fieldName}`;
            if (_.has(hull, fieldPath)) {
              segment.filtered = _.includes(_.get(hull, fieldPath, []), segment.id);
            }
            return segment;
          });
          hull.segments = hull.users_segments;
          hull.accounts_segments = accounts_segments;
          return next();
        },
        () => next()
      );
  };
};
