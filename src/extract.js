import Promise from "bluebird";
import CSVStream from "csv-stream";
import JSONStream from "JSONStream";
import requestClient from "request";
import ps from "promise-streams";
import BatchStream from "batch-stream";
import URI from "urijs";


/**
 * @param {Object} body Request Body Object
 * @param {Object} batchSize
 * @param {Function} callback returning a Promise
 * @return {Promise}
 *
 * return handleExtract(req, 100, (users) => Promise.resolve())
 */
export function handle({ body, batchSize, handler }) {
  const { logger } = this;
  const { url, format } = body;
  if (!url) return Promise.reject(new Error("Missing URL"));
  const decoder = format === "csv" ? CSVStream.createStream({ escapeChar: "\"", enclosedChar: "\"" }) : JSONStream.parse();

  const batch = new BatchStream({ size: batchSize });

  return requestClient({ url })
    .pipe(decoder)
    .pipe(batch)
    .pipe(ps.map({ concurrent: 2 }, (...args) => {
      try {
        return handler(...args);
      } catch (e) {
        logger.error("ExtractAgent.handleExtract.error", e.stack || e);
        return Promise.reject(e);
      }
    }))
    .promise()
    .then(() => true);
}

/**
 * Start an extract job and be notified with the url when complete.
 * @param  {Object} options
 * @return {Promise}
 */
export function request({ hostname, segment = null, format = "json", path = "batch", fields = [] } = {}) {
  const client = this;
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
