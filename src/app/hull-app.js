import Server from "./server";
import Worker from "./worker";

/**
 *
 */
export default class HullApp {
  constructor({ Hull, hostSecret, instrumentation, cache, queue, service }) {
    this.Hull = Hull;
    this.hostSecret = hostSecret;
    this.instrumentation = instrumentation;
    this.cache = cache;
    this.queue = queue;
    this.service = service;
  }

  server() {
    const { Hull, hostSecret, service, instrumentation, cache, queue } = this;
    this.server = Server({ Hull, instrumentation, cache, queue });
    this.server.use(Hull.Middleware({ hostSecret }));
    this.server.use(serviceMiddleware(service));
    return this.server;
  }

  worker() {
    const { Hull, hostSecret, service, instrumentation, cache, queue } = this;
    this.worker = new Worker({ Hull, instrumentation, cache, queue });
    this.worker.use(Hull.Middleware({ hostSecret }));
    this.worker.use(serviceMiddleware(service));
    return this.worker;
  }

  start({ server = true, worker = false }) {
    if (server) {
      this.server.use(this.instrumentation.stopMiddleware());
      this.server.listen(process.env.PORT || 8080);
    }

    if (worker) {
      this.worker.process();
    }
  }
}
