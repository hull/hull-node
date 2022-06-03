const Promise = require("bluebird");
const URI = require("urijs");
const _ = require("lodash");

/**
 * This is a method to request an extract of user base to be sent back to the Connector to a selected `path` which should be handled by `notifHandler`.
 *
 * @public
 * @name requestExtract
 * @memberof Context.helpers
 * @param {Object}   ctx Hull request context
 * @param {Object} [options={}]
 * @param {Object} [options.segment=null]
 * @param {Object} [options.format=json]
 * @param {Object} [options.path=/batch]
 * @param {Object} [options.fields=[]]
 * @param {Object} [options.additionalQuery={}]
 * @return {Promise}
 * @example
 * req.hull.helpers.requestExtract({ segment = null, path, fields = [], additionalQuery = {} });
 */
module.exports = function requestExtract(ctx, {
  segment = null, format = "json", path = "batch", fields = [], additionalQuery = {}
} = {}) {
  const { client, hostname } = ctx;
  const conf = client.configuration();
  const search = _.merge({
    ship: conf.id,
    secret: conf.secret,
    organization: conf.organization,
    source: "connector"
  }, additionalQuery);

  if (segment) {
    search.segment_id = segment.id;
  }
  const url = URI(`https://${hostname}`)
    .path(path)
    .search(search)
    .toString();

  return (() => {
    if (segment == null) {
      return Promise.resolve({
        query: {}
      });
    }

    if (segment.query) {
      return Promise.resolve(segment);
    }
    return client.get(segment.id);
  })()
    .then(({ query }) => {
      const params = {
        query, format, url, fields
      };
      client.logger.debug("connector.requestExtract.params", params);
      return client.post("extract/user_reports", params);
    });
};
