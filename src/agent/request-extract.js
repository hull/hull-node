import Promise from "bluebird";
import URI from "urijs";

/**
 * Start an extract job and be notified with the url when complete.
 * @param {Object} ctx The Context Object
 * @param  {Object} options
 * @return {Promise}
 */
export default function requestExtract(ctx, { segment = null, format = "json", path = "batch", fields = [] }) {
  const { client, hostname } = ctx;
  const search = client.configuration();
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
    client.logger.info("requestExtract", params);
    return client.post("extract/user_reports", params);
  });
}
