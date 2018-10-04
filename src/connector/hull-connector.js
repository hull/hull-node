// @flow
import type {
  $Application,
  $Response,
  NextFunction,
} from "express";
import type {
  HullConnectorConfig,
  HullRequestFull,
  HullExternalHandlerCallback,
  HullNotificationHandlerConfiguration,
  JsonConfig
} from "../types";

const express = require("express");
const Promise = require("bluebird");
const _ = require("lodash");
const { renderFile } = require("ejs");
const debug = require("debug")("hull-connector");
const {
  actionHandler,
  scheduleHandler,
  notificationHandler,
  batchHandler
} = require("../handlers");

const HullClient = require("hull-client");
const { onExit, staticRouter } = require("../utils");
const Worker = require("./worker");
const {
  credentialsFromQueryMiddleware,
  contextBaseMiddleware,
  fullContextFetchMiddleware,
  clientMiddleware
} = require("../middlewares");
const { Instrumentation, Cache, Queue, Batcher } = require("../infra");


const getReducedChannels = handlers => (
  channels
): HullNotificationHandlerConfiguration =>
  _.reduce(
    channels,
    (h, { options, handler }, channel) => {
      h[channel] = {
        callback: handlers[handler],
        options
      };
      return h;
    },
    {}
  );

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
  port: $PropertyType<HullConnectorConfig, "port">;

  json: JsonConfig;

  connectorConfig: HullConnectorConfig;

  hostSecret: $PropertyType<HullConnectorConfig, "hostSecret">;
  middlewares: $PropertyType<HullConnectorConfig, "middlewares">;
  clientConfig: $PropertyType<HullConnectorConfig, "clientConfig">;

  manifest: $PropertyType<HullConnectorConfig, "manifest">;
  handlers: $PropertyType<HullConnectorConfig, "handlers">

  cache: Cache;
  queue: Queue;
  instrumentation: Instrumentation;

  _worker: Worker;
  Worker: typeof Worker;
  HullClient: typeof HullClient;
  static bind: Function;

  constructor(
    dependencies: {
      Worker: typeof Worker,
      HullClient: typeof HullClient
    },
    connectorConfig: HullConnectorConfig
  ) {
    if(!connectorConfig) {
      throw new Error("You need to pass a Connector Configuration Object. Checkout types.js -> HullConnectorConfig")
    }

    const {
      hostSecret,
      port,
      json = {},
      clientConfig = {},
      middlewares = [],
      handlers = {},
      instrumentation = new Instrumentation(),
      cache = new Cache(),
      queue = new Queue(),
      manifest,
      connectorName
    } = connectorConfig;


    debug("clientConfig", clientConfig);
    this.HullClient = dependencies.HullClient;
    this.Worker = dependencies.Worker;
    this.port = port;

    this.instrumentation = instrumentation;
    this.middlewares = middlewares;
    this.cache = cache;
    this.queue = queue;
    this.hostSecret = hostSecret;
    this.json = json;
    this.manifest = manifest;
    this.handlers = handlers;
    this.clientConfig = clientConfig;

    try {
      this.connectorConfig = _.pick(connectorConfig, [
        "timeout",
        "nnotificationValidatorHttpClient",
        "skipSignatureValidation",
        "hostSecret"
      ]) || {};


      clientConfig.connectorName = connectorName || _.kebabCase((manifest||{}).name || "");
      this.clientConfig = clientConfig
    } catch (e) {
      console.log(e) //eslint-disable-line no-console
    }

    onExit(() => {
      return Promise.all([Batcher.exit(), this.queue.exit()]);
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
    this.middlewares.map(middleware => app.use(middleware));
    app.use((req, res, next: NextFunction) => {
      debug(
        "incoming request",
        _.pick(req, "headers", "url", "method", "body")
      );
      next();
    });
    app.use(express.json({ limit: "10mb", ...this.json }));
    app.use("/", staticRouter());
    app.use(this.instrumentation.startMiddleware());
    app.use(
      contextBaseMiddleware({
        instrumentation: this.instrumentation,
        queue: this.queue,
        cache: this.cache,
        connectorConfig: this.connectorConfig,
        clientConfig: this.clientConfig,
        HullClient: this.HullClient
      })
    );

    app.engine("html", renderFile);

    app.set("views", `${process.cwd()}/views`);
    app.set("view engine", "ejs");
    return app;
  }

  /**
   * This is a supplement method which calls `app.listen` internally and also terminates instrumentation of the application calls.
   * If any error is not caught on handler level it will first go through instrumentation handler reporting it to sentry
   * and then a `500 Unhandled Error` response will be send back to the client.
   * The response can be provided by the handler before passing it here.
   * @public
   * @param  {express} app expressjs application
   * @return {http.Server}
   */
  startApp(app: $Application) {
    /**
     * Instrumentation Middleware
     */
    app.use(this.instrumentation.stopMiddleware());

    /**
     * Unhandled error middleware
     */
    app.use((
      err: Error,
      req: HullRequestFull,
      res: $Response,
      next: NextFunction // eslint-disable-line no-unused-vars
    ) => {
      debug("unhandled-error", err.message);
      if (!res.headersSent) {
        res.status(500).send("unhandled-error");
      }
    });

    return app.listen(this.port, () => {
      this.HullClient.logger.info("connector.server.listen", {
        port: this.port
      });
      // debug("connector.server.listen", { port: this.port });
    });
  }

  setupRoutes(app: $Application): $Application{
    if (!this.manifest) {
      throw new Error("Hull Connector framework hasn't been initialized properly. Missing Manifest")
    }
    const {
      tabs = [],
      batch = [],
      // status = [],
      schedules = [],
      subscriptions = [],
      endpoints = []
    } = this.manifest;

    tabs.map(({ url, handler, options }) => {
      // $FlowFixMe
      const callback: HullExternalHandlerCallback = this.handlers[handler];
      if (callback) {
        // $FlowFixMe
        app.get(url, actionHandler({ options, callback }));
      }
    });
    endpoints.map(({ url, method, handler, options }) => {
      // $FlowFixMe
      const callback: HullExternalHandlerCallback = this.handlers[handler];
      if (callback) {
        // We want to use a manifest-configured method for the endpoint
        // $FlowFixMe
        app[method.toLowerCase()](url, actionHandler({ options, callback }));
      }
    });
    schedules.map(({ url, handler, options }) => {
      const callback: HullExternalHandlerCallback = this.handlers[handler];
      app.post(url, scheduleHandler({ options, callback }));
    });

    const reduceChannels = getReducedChannels(this.handlers);

    batch.map(({ channels, url }) => {
      const handlers = reduceChannels(channels);
      app.post(url, batchHandler(handlers));
    });
    subscriptions.map(({ channels, url }) => {
      const handlers = reduceChannels(channels);
      app.post(url, notificationHandler(handlers));
    });

    return app;

  }

  worker(jobs: Object) {
    this._worker = new this.Worker({
      instrumentation: this.instrumentation,
      queue: this.queue
    });
    this._worker.use(this.instrumentation.startMiddleware());
    this._worker.use(
      contextBaseMiddleware({
        instrumentation: this.instrumentation,
        queue: this.queue,
        cache: this.cache,
        connectorConfig: this.connectorConfig,
        clientConfig: this.clientConfig,
        HullClient: this.HullClient
      })
    );
    this._worker.use(credentialsFromQueryMiddleware());
    this._worker.use(clientMiddleware());
    this._worker.use(fullContextFetchMiddleware());
    this.middlewares.map(middleware => this._worker.use(middleware));

    this._worker.setJobs(jobs);
    return this._worker;
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
