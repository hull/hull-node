// @flow
import type { $Application, $Response, NextFunction, Middleware } from "express";
import type { HullConnectorOptions, HullRequestBase } from "../types";

const Promise = require("bluebird");
const fs = require("fs");
const _ = require("lodash");
const { renderFile } = require("ejs");
const debug = require("debug")("hull-connector");

const HullClient = require("hull-client");
const { staticRouter } = require("../utils");
const Worker = require("./worker");
const { configurationFromQueryMiddleware, contextBaseMiddleware, fullContextFetchMiddleware, clientMiddleware } = require("../middlewares");
const { Instrumentation, Cache, Queue, Batcher } = require("../infra");
const { onExit } = require("../utils");
// const { TransientError } = require("../errors");

/**
 * @public
 * @param {Object}        dependencies
 * @param {Object}        [options={}]
 * @param {string}        [options.connectorName] force connector name - if not provided will be taken from manifest.json
 * @param {string}        [options.hostSecret] secret to sign req.hull.token
 * @param {Number|string} [options.port] port on which expressjs application should be started
 * @param {Object}        [options.clientConfig] additional `HullClient` configuration
 * @param {boolean}       [options.skipSignatureValidation] skip signature validation on notifications (for testing only)
 * @param {number|string} [options.timeout] global HTTP server timeout - format is parsed by `ms` npm package
 * @param {Object}        [options.instrumentation] override default InstrumentationAgent
 * @param {Object}        [options.cache] override default CacheAgent
 * @param {Object}        [options.queue] override default QueueAgent
 */
class HullConnector {
  port: $PropertyType<HullConnectorOptions, 'port'>;
  middlewares: Array<Function>;
  connectorConfig: {};
  cache: $PropertyType<HullConnectorOptions, 'cache'>;
  queue: $PropertyType<HullConnectorOptions, 'queue'>;
  instrumentation: $PropertyType<HullConnectorOptions, 'instrumentation'>;
  hostSecret: $PropertyType<HullConnectorOptions, 'hostSecret'>;
  clientConfig: $PropertyType<HullConnectorOptions, 'clientConfig'>;
  _worker: Worker;

  Worker: typeof Worker;
  HullClient: typeof HullClient;

  static bind: Function;

  constructor(dependencies: Object, {
    hostSecret, port, clientConfig = {}, instrumentation, cache, queue, connectorName, skipSignatureValidation, timeout
  }: HullConnectorOptions = {}) {
    this.HullClient = dependencies.HullClient;
    this.Worker = dependencies.Worker;
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
        const manifest = JSON.parse(fs.readFileSync(`${process.cwd()}/manifest.json`).toString());
        if (manifest.name) {
          this.clientConfig.connectorName = _.kebabCase(manifest.name);
        }
      } catch (error) {} // eslint-disable-line no-empty
    }

    if (skipSignatureValidation) {
      this.connectorConfig.skipSignatureValidation = skipSignatureValidation;
    }

    if (timeout) {
      this.connectorConfig.timeout = timeout;
    }

    onExit(() => {
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
  setupApp(app: $Application): $Application {
    app.use("/", staticRouter());
    app.use(this.instrumentation.startMiddleware());
    app.use(contextBaseMiddleware({
      instrumentation: this.instrumentation,
      queue: this.queue,
      cache: this.cache,
      connectorConfig: this.connectorConfig
    }));

    app.engine("html", renderFile);

    app.set("views", `${process.cwd()}/views`);
    app.set("view engine", "ejs");

    app.use(this.instrumentation.ravenContextMiddleware());
    app.use((req: HullRequestBase, res: $Response, next: NextFunction) => {
      req.hull.metric.increment("connector.request", 1);
      next();
    });
    this.middlewares.map(middleware => app.use(middleware));
    return app;
  }

  /**
   * This is a supplement method which calls `app.listen` internally and also terminates instrumentation of the application calls.
   * @public
   * @param  {express} app expressjs application
   * @return {http.Server}
   */
  startApp(app: $Application) {
    /**
     * Transient Middleware
     */
    // app.use((err: Error, req: HullRequest, res: $Response, next: NextFunction) => {
    //   if (err instanceof TransientError || (err.name === "ServiceUnavailableError" && err.message === "Response timeout")) {
    //     req.hull.metric.increment("connector.transient_error", 1, [
    //       `error_name:${_.snakeCase(err.name)}`,
    //       `error_message:${_.snakeCase(err.message)}`
    //     ]);
    //     if (req.hull.smartNotifierResponse) {
    //       const response = req.hull.smartNotifierResponse;
    //       return res.status(err.status || 503).json(response.toJSON());
    //     }
    //     return res.status(err.status || 503).send("transient-error");
    //   }
    //   // pass the error
    //   return next(err);
    // });

    /**
     * Instrumentation Middleware
     */
    app.use(this.instrumentation.stopMiddleware());

    /**
     * Unhandled error middleware
     */
    // app.use((err: Error, req: HullRequest, res: $Response, next: NextFunction) => { // eslint-disable-line no-unused-vars
    //   if (req.hull && req.hull.smartNotifierResponse) {
    //     const response = req.hull.smartNotifierResponse;
    //     return res.status(500).json(response.toJSON());
    //   }
    //   return res.status(500).send("unhandled-error");
    // });

    return app.listen(this.port, () => {
      debug("connector.server.listen", { port: this.port });
    });
  }

  worker(jobs: Object) {
    this._worker = new this.Worker({
      instrumentation: this.instrumentation,
      queue: this.queue
    });
    this._worker.use(this.instrumentation.startMiddleware());
    this._worker.use(contextBaseMiddleware({
      instrumentation: this.instrumentation,
      queue: this.queue,
      cache: this.cache,
      connectorConfig: this.connectorConfig
    }));
    this._worker.use(configurationFromQueryMiddleware());
    this._worker.use(clientMiddleware({ HullClient: this.HullClient }));
    this._worker.use(fullContextFetchMiddleware());
    this.middlewares.map(middleware => this._worker.use(middleware));

    this._worker.setJobs(jobs);
    return this._worker;
  }

  use(middleware: Middleware) {
    this.middlewares.push(middleware);
    return this;
  }

  startWorker(queueName: string = "queueApp") {
    this.instrumentation.exitOnError = true;
    if (this._worker) {
      this._worker.process(queueName);
      debug("connector.worker.process", { queueName });
    }
  }
}

module.exports = HullConnector;
