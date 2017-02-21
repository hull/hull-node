import express from "express";
import { renderFile } from "ejs";
import timeout from "connect-timeout";

import staticRouter from "../util/static-router";


/**
 * Base Express app for Ships front part
 */
export default function WebApp({ Hull, instrumentation, queue, cache }) {
  const app = express();

  if (instrumentation) {
    app.use(instrumentation.startMiddleware());
    app.use(instrumentation.middleware);
  }

  if (queue) {
    app.use(queue.middleware);
  }

  if (cache) {
    app.use(cache.middleware);
  }

  // the main responsibility of following timeout middleware
  // is to make the web app respond always in time
  app.use(timeout("25s"));
  app.engine("html", renderFile);

  app.set("views", `${process.cwd()}/views`);
  app.set("view engine", "ejs");

  app.use("/", staticRouter({ Hull }));

  const originalListen = app.listen;
  app.listen = function listenHull(...args) {
    app.listen = originalListen;
    if (instrumentation) {
      app.use(instrumentation.stopMiddleware());
    }
    Hull.logger.info("webApp.listen", args[0]);
    return app.listen(...args);
  };

  return app;
}
