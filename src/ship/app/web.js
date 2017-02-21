import express from "express";
import { renderFile } from "ejs";
import timeout from "connect-timeout";

import staticRouter from "../util/static-router";


/**
 * Base Express app for Ships front part
 */
export default function WebApp({ Hull, instrumentation }) {
  if (!Hull || !instrumentation) {
    throw new Error("WebApp initialized without all dependencies: Hull, instrumentation.")
  }

  const app = express();

  app.use(instrumentation.startMiddleware());

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
    app.use(instrumentation.stopMiddleware());
    Hull.logger.info("webApp.listen", args[0]);
    return app.listen(...args);
  };

  return app;
}
