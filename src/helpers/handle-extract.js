const Promise = require("bluebird");
const CSVStream = require("csv-stream");
const JSONStream = require("JSONStream");
const superagent = require("superagent");
const ps = require("promise-streams");
const BatchStream = require("batch-stream");
const _ = require("lodash");

/**
 * Helper function to handle JSON extract sent to batch endpoint
 *
 * @name handleExtract
 * @public
 * @memberof Context.helpers
 * @param {Object}   ctx Hull request context
 * @param {Object}   options
 * @param {Object}   options.body       request body object (req.body)
 * @param {Object}   options.batchSize  size of the chunk we want to pass to handler
 * @param {Function} options.handler    callback returning a Promise (will be called with array of elements)
 * @param {Function} options.onResponse callback called on successful inital response
 * @param {Function} options.onError    callback called during error
 * @return {Promise}
 */
module.exports = function handleExtract(ctx, { body, batchSize, handler, onResponse, onError }) {
  const { logger } = ctx.client;
  const { url, format } = body;
  if (!url) return Promise.reject(new Error("Missing URL"));
  const decoder = format === "csv" ? CSVStream.createStream({ escapeChar: "\"", enclosedChar: "\"" }) : JSONStream.parse();

  if (format === "csv") {
    // Workaround over problems on Node v8
    decoder._encoding = "utf8";
  }

  const batch = new BatchStream({ size: batchSize, highWaterMark: 1 });

  return superagent
    .post(url)
    .on("response", (response) => {
      if (_.isFunction(onResponse)) {
        onResponse(response);
      }
    })
    .on("error", (error) => {
      if (_.isFunction(onError)) {
        onError(error);
      }
    })
    .pipe(decoder)
    .pipe(batch)
    .pipe(ps.map({ concurrent: 1 }, (...args) => {
      try {
        return handler(...args);
      } catch (e) {
        logger.error("ExtractAgent.handleExtract.error", e.stack || e);
        return Promise.reject(e);
      }
    }))
    .promise()
    .then(() => true);
};
