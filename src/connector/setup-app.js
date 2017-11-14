const { renderFile } = require("ejs");
const timeout = require("connect-timeout");

const {
  staticRouter, tokenMiddleware, notifMiddleware, smartNotifierMiddleware, smartNotifierErrorMiddleware
} = require("../utils");


/**
 * Base Express app for Ships front part
 */
export default function setupApp({ instrumentation, queue, cache, app, connectorConfig }) {
  app.use(tokenMiddleware());
  app.use(notifMiddleware());
  app.use(smartNotifierMiddleware({ skipSignatureValidation: connectorConfig.skipSignatureValidation }));
  app.use(instrumentation.startMiddleware());

  app.use(instrumentation.contextMiddleware());
  app.use(queue.contextMiddleware());
  app.use(cache.contextMiddleware());

  // the main responsibility of following timeout middleware
  // is to make the web app respond always in time
  app.use(timeout("25s"));
  app.engine("html", renderFile);

  app.set("views", `${process.cwd()}/views`);
  app.set("view engine", "ejs");

  app.use("/", staticRouter());

  app.use(smartNotifierErrorMiddleware());


  return app;
}
