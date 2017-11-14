const Promise = require("bluebird");
const URI = require("urijs");
const _ = require("lodash");

/**
 * Start an extract job and be notified with the url when complete.
 * @param  {Object} options
 * @return {Promise}
 */
module.exports = function requestExtract(ctx, { segment = null, format = "json", path = "batch", fields = [], additionalQuery = {} } = {}) {
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
    const params = { query, format, url, fields };
    client.logger.debug("connector.requestExtract.params", params);
    return client.post("extract/user_reports", params);
  });
};
