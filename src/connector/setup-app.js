const { renderFile } = require("ejs");
const timeout = require("connect-timeout");

const {
  staticRouter, tokenMiddleware, notifMiddleware, smartNotifierMiddleware, helpersMiddleware, segmentsMiddleware
} = require("../utils");

function haltOnTimedout(req, res, next) {
  if (!req.timedout) {
    next();
  }
}

/**
 * This function setups express application pre route middleware stack
 */
module.exports = function setupApp({ instrumentation, queue, cache, workspaceCache, app, connectorConfig, clientMiddleware, middlewares }) {
  /**
   * This middleware overwrites default `send` and `json` methods to make it timeout aware,
   * and not to try to respond second time after previous response after a timeout happened
   */
  app.use((req, res, next) => {
    const originalSend = res.send;
    const originalJson = res.json;
    res.json = function customJson(data) {
      if (res.headersSent) {
        return;
      }
      originalJson.bind(res)(data);
    };
    res.send = function customSend(data) {
      if (res.headersSent) {
        return;
      }
      originalSend.bind(res)(data);
    };
    next();
  });

  /**
   * The main responsibility of following timeout middleware
   * is to make the web app respond always in time
   */
  app.use(timeout(connectorConfig.timeout || "25s"));

  app.use("/", staticRouter());

  app.use(tokenMiddleware());
  app.use(notifMiddleware());
  app.use(haltOnTimedout);
  app.use(smartNotifierMiddleware({ skipSignatureValidation: connectorConfig.skipSignatureValidation }));
  app.use(haltOnTimedout);
  app.use(instrumentation.startMiddleware());

  app.use(instrumentation.contextMiddleware());
  app.use(queue.contextMiddleware());
  app.use(cache.contextMiddleware());
  app.use(workspaceCache.workspaceMiddleware());

  app.engine("html", renderFile);

  app.set("views", `${process.cwd()}/views`);
  app.set("view engine", "ejs");

  app.use((req, res, next) => {
    req.hull = req.hull || {};
    req.hull.connectorConfig = connectorConfig;
    next();
  });
  app.use(clientMiddleware);
  app.use(haltOnTimedout);
  app.use(instrumentation.ravenContextMiddleware());
  app.use((req, res, next) => {
    req.hull.metric.increment("connector.request", 1);
    next();
  });
  app.use(helpersMiddleware());
  app.use(haltOnTimedout);
  app.use(segmentsMiddleware());
  app.use(haltOnTimedout);
  middlewares.map(middleware => app.use(middleware));

  return app;
};
