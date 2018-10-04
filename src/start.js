//@flow

const express = require("express");
import type { HullConnectorConfig } from "./types";
import typeof HullConnectorClass from "./middlewares/hull-context-middleware";

module.exports = function(Connector: Class<HullConnectorClass>) {
  return function(connectorConfig: HullConnectorConfig) {
    const connector = new Connector(connectorConfig);
    const app = express();
    connector
      .setupApp(app)
      .setupRoutes(app)
      .startApp(app);
    return app;
  };
};
