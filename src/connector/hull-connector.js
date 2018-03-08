const Promise = require("bluebird");
const fs = require("fs");
const _ = require("lodash");

const setupApp = require("./setup-app");
const Worker = require("./worker");
const { Instrumentation, Cache, Queue, Batcher } = require("../infra");
const { exitHandler, segmentsMiddleware, requireHullMiddleware, helpersMiddleware } = require("../utils");
const { TransientError } = require("../errors");

class HullConnector {
  constructor(Hull, {
    hostSecret, port, clientConfig = {}, instrumentation, cache, queue, connectorName, segmentFilterSetting, skipSignatureValidation, timeout
  } = {}) {
    this.Hull = Hull;
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

  startApp(app) {
    /**
     * Transient Middleware
     */
    app.use((err, req, res, next) => {
      if (err instanceof TransientError || err.name === "ServiceUnavailableError") {
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
      this.Hull.logger.info("connector.server.listen", { port: this.port });
    });
  }

  worker(jobs) {
    this._worker = this._worker || new Worker({
      Hull: this.Hull,
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
    this._middleware = this._middleware || this.Hull.Middleware({
      hostSecret: this.hostSecret,
      clientConfig: this.clientConfig
    });
    return this._middleware;
  }

  startWorker(queueName = "queueApp") {
    this.instrumentation.exitOnError = true;
    if (this._worker) {
      this._worker.process(queueName);
      this.Hull.logger.info("connector.worker.process", { queueName });
    }
  }
}

module.exports = HullConnector;
