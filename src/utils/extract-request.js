// @flow
import type { HullContext } from "../types";

const Promise = require("bluebird");
const URI = require("urijs");
const _ = require("lodash");

/**
 * This is a method to request an extract of user base to be sent back to the Connector to a selected `path` which should be handled by `notifHandler`.
 *
 * @public
 * @name requestExtract
 * @memberof Utils
 * @param {Object} options={}
 * @param {Object} options.client
 * @param {string} options.hostname
 * @param {Object} [options.segment=null]
 * @param {Object} [options.format=json]
 * @param {Object} [options.path=/batch]
 * @param {Object} [options.fields=[]]
 * @param {Object} [options.additionalQuery={}]
 * @return {Promise}
 * @example
 * req.hull.helpers.requestExtract({ segment = null, path, fields = [], additionalQuery = {} });
 */
function extractRequest(ctx: HullContext, { segment = null, format = "json", path = "batch", fields = [], additionalQuery = {} }: Object) {
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
    return client.get(segment.id, {});
  })()
  .then(({ query }) => {
    const params = { query, format, url, fields };
    client.logger.debug("connector.requestExtract.params", params);
    return client.post("extract/user_reports", params);
  });
}

module.exports = extractRequest;
