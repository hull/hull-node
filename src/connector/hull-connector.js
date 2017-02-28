import Promise from "bluebird";

import setupApp from "./setup-app";
import Worker from "./worker";
import { Instrumentation, Cache, Queue, Batcher } from "../infra";
import { exitHandler, serviceMiddleware, notifMiddleware, segmentsMiddleware, requireHullMiddleware } from "../utils";


export default class HullConnector {
  constructor(Hull, {
    hostSecret, port, clientConfig = {}, instrumentation, cache, queue, service
  } = {}) {
    this.Hull = Hull;
    this.instrumentation = instrumentation || new Instrumentation();
    this.cache = cache || new Cache();
    this.queue = queue || new Queue();
    this.port = port;
    this.hostSecret = hostSecret;
    this.service = service;
    this.clientConfig = clientConfig;

    this.notifMiddleware = notifMiddleware;

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
      queue: this.queue
    });
    app.use(this.clientMiddleware());
    app.use(segmentsMiddleware());
    app.use(serviceMiddleware(this.service));
    return app;
  }

  startApp(app) {
    app.use(this.instrumentation.stopMiddleware());
    app.listen(this.port, () => {
      this.Hull.logger.info("HullApp.server.listen", this.port);
    });
    return app;
  }

  worker(jobs) {
    this._worker = new Worker({
      Hull: this.Hull,
      instrumentation: this.instrumentation,
      cache: this.cache,
      queue: this.queue
    });
    this._worker.use(this.clientMiddleware());
    this._worker.use(requireHullMiddleware());
    this._worker.use(segmentsMiddleware());
    this._worker.use(serviceMiddleware(this.service));
    this._worker.setJobs(jobs);
    return this._worker;
  }

  clientMiddleware() {
    this._middleware = this._middleware || this.Hull.Middleware({
      hostSecret: this.hostSecret,
      clientConfig: this.clientConfig
    });
    return this._middleware;
  }

  startWorker() {
    if (this._worker) {
      this._worker.process();
      this.Hull.logger.info("HullApp.worker.process");
    }
  }
}
