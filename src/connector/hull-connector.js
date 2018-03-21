const Promise = require("bluebird");
const fs = require("fs");
const _ = require("lodash");

const setupApp = require("./setup-app");
const Worker = require("./worker");
const { Instrumentation, Cache, Queue, Batcher } = require("../infra");
const { exitHandler, segmentsMiddleware, requireHullMiddleware, helpersMiddleware } = require("../utils");
const { TransientError } = require("../errors");

/**
 * @public
 * @param {HullClient}    HullClient
 * @param {Object}        [options={}]
 * @param {string}        [options.connectorName] force connector name - if not provided will be taken from manifest.json
 * @param {string}        [options.hostSecret] secret to sign req.hull.token
 * @param {Number|string} [options.port] port on which expressjs application should be started
 * @param {Object}        [options.clientConfig] additional `HullClient` configuration
 * @param {boolean}       [options.skipSignatureValidation] skip signature validation on notifications (for testing only)
 * @param {number|string} [options.timeout] global HTTP server timeout
 * @param {Object}        [options.instrumentation] override default InstrumentationAgent
 * @param {Object}        [options.cache] override default CacheAgent
 * @param {Object}        [options.queue] override default QueueAgent
 */
class HullConnector {
  constructor(HullClient, {
    hostSecret, port, clientConfig = {}, instrumentation, cache, queue, connectorName, segmentFilterSetting, skipSignatureValidation, timeout
  } = {}) {
    this.HullClient = HullClient;
    this.instrumentation = instrumentation || new Instrumentation();
    this.cache = cache || new Cache();
    this.queue = queue || new Queue();
    this.port = port;
    this.hostSecret = hostSecret;
    this.clientConfig = clientConfig;
    this.connectorConfig = {};
    this.middlewares = [];

    if (connectorName) {
      this.clientConfig.connectorName = connectorName;
    } else {
      try {
        const manifest = JSON.parse(fs.readFileSync(`${process.cwd()}/manifest.json`));
        if (manifest.name) {
          this.clientConfig.connectorName = _.kebabCase(manifest.name);
        }
      } catch (error) {} // eslint-disable-line no-empty
    }

    if (segmentFilterSetting) {
      this.connectorConfig.segmentFilterSetting = segmentFilterSetting;
    }

    if (skipSignatureValidation) {
      this.connectorConfig.skipSignatureValidation = skipSignatureValidation;
    }

    if (timeout) {
      this.connectorConfig.timeout = timeout;
    }

    exitHandler(() => {
      return Promise.all([
        Batcher.exit(),
        this.queue.exit()
      ]);
    });
  }

  /**
   * This method applies all features of `Hull.Connector` to the provided application:
   *   - serving `/manifest.json`, `/readme` and `/` endpoints
   *   - serving static assets from `/dist` and `/assets` directiories
   *   - rendering `/views/*.html` files with `ejs` renderer
   *   - timeouting all requests after 25 seconds
   *   - adding Newrelic and Sentry instrumentation
   *   - initiating the wole [Context Object](#context)
   *   - handling the `hullToken` parameter in a default way
   * @public
   * @param  {express} app expressjs application
   * @return {express}     expressjs application
   */
  setupApp(app) {
    setupApp({
      app,
      instrumentation: this.instrumentation,
      cache: this.cache,
      queue: this.queue,
      connectorConfig: this.connectorConfig,
      clientMiddleware: this.clientMiddleware(),
      middlewares: this.middlewares
    });
    return app;
  }

  /**
   * This is a supplement method which calls `app.listen` internally and also terminates instrumentation of the application calls.
   * @public
   * @param  {express} app expressjs application
   * @return {http.Server}
   */
  startApp(app) {
    /**
     * Transient Middleware
     */
    app.use((err, req, res, next) => {
      if (err instanceof TransientError || (err.name === "ServiceUnavailableError" && err.message === "Response timeout")) {
        req.hull.metric.increment("connector.transient_error", 1, [
          `error_name:${_.snakeCase(err.name)}`,
          `error_message:${_.snakeCase(err.message)}`
        ]);
        if (req.hull.smartNotifierResponse) {
          const response = req.hull.smartNotifierResponse;
          return res.status(err.status || 503).json(response.toJSON());
        }
        return res.status(err.status || 503).send("transient-error");
      }
      // pass the error
      return next(err);
    });

    /**
     * Instrumentation Middleware
     */
    app.use(this.instrumentation.stopMiddleware());

    /**
     * Unhandled error middleware
     */
    app.use((err, req, res, next) => { // eslint-disable-line no-unused-vars
      if (req.hull.smartNotifierResponse) {
        const response = req.hull.smartNotifierResponse;
        return res.status(500).json(response.toJSON());
      }
      return res.status(500).send("unhandled-error");
    });

    return app.listen(this.port, () => {
      this.HullClient.logger.info("connector.server.listen", { port: this.port });
    });
  }

  worker(jobs) {
    this._worker = this._worker || new Worker({
      Hull: this.HullClient,
      instrumentation: this.instrumentation,
      cache: this.cache,
      queue: this.queue
    });
    this._worker.use((req, res, next) => {
      req.hull = req.hull || {};
      req.hull.connectorConfig = this.connectorConfig;
      next();
    });
    this._worker.use(this.clientMiddleware());
    this._worker.use(requireHullMiddleware());
    this._worker.use(helpersMiddleware());
    this._worker.use(segmentsMiddleware());
    this.middlewares.map(middleware => this._worker.use(middleware));

    this._worker.setJobs(jobs);
    return this._worker;
  }

  use(middleware) {
    this.middlewares.push(middleware);
    return this;
  }

  clientMiddleware() {
    this._middleware = this._middleware || this.HullClient.Middleware({
      hostSecret: this.hostSecret,
      clientConfig: this.clientConfig
    });
    return this._middleware;
  }

  startWorker(queueName = "queueApp") {
    this.instrumentation.exitOnError = true;
    if (this._worker) {
      this._worker.process(queueName);
      this.HullClient.logger.info("connector.worker.process", { queueName });
    }
  }
}

module.exports = HullConnector;
