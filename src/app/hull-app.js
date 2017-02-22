import Promise from "bluebird";

import Server from "./server";
import Worker from "./worker";
import { Instrumentation, Cache, Queue, Batcher } from "../infra";
import { exitHandler, serviceMiddleware } from "../utils";


export default function HullApp({
  Hull, hostSecret, port, clientConfig = {}, instrumentation, cache, queue, service
}) {
  if (!instrumentation) {
    instrumentation = new Instrumentation();
  }

  if (!cache) {
    cache = new Cache();
  }

  if (!queue) {
    queue = new Queue();
  }

  exitHandler(() => {
    return Promise.all([
      Batcher.exit(),
      this.queue.exit()
    ]);
  });

  return {
    server: function getServer() {
      this._server = Server({ Hull, instrumentation, cache, queue });
      this._server.use(Hull.Middleware({ hostSecret, clientConfig }));
      this._server.use(serviceMiddleware(service));
      return this._server;
    },
    worker: function getWorker() {
      this._worker = new Worker({ Hull, instrumentation, cache, queue });
      this._worker.use(Hull.Middleware({ hostSecret, clientConfig }));
      this._worker.use(serviceMiddleware(service));
      return this._worker;
    },
    start: function startApp({ server = true, worker = false } = {}) {
      if (this._server && server) {
        this._server.use(instrumentation.stopMiddleware());
        this._server.listen(port);
      }

      if (this._worker && worker) {
        this._worker.process();
      }
    }
  };
}
