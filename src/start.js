//@flow

const express = require("express");
const _ = require("lodash");
const {
  actionHandler,
  scheduleHandler,
  notificationHandler,
  batchHandler
} = require("./handlers");

import type {
  HullServerConfig,
  HullExternalHandlerCallback,
  HullNotificationHandlerConfiguration
} from "./types";
import type HullConnectorClass from "./middlewares/hull-context-middleware";

const getReducer = handlers => (
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

module.exports = function(Connector: Class<HullConnectorClass>) {
  return function({
    manifest,
    middlewares = [],
    handlers = {},
    connectorConfig
  }: HullServerConfig) {
    const {
      tabs = [],
      batch = [],
      // status = [],
      schedules = [],
      subscriptions = [],
      endpoints = []
    } = manifest;

    const connector = new Connector(connectorConfig);

    //Setup connectors middlewares that need to run before Hull (usually auth middlewares)
    const app = express();
    middlewares.map(m => app.use(m));
    connector.setupApp(app);

    tabs.map(({ url, handler, options }) => {
      // $FlowFixMe
      const callback: HullExternalHandlerCallback = handlers[handler];
      if (callback) {
        // $FlowFixMe
        app.get(url, actionHandler({ options, callback }));
      }
    });
    endpoints.map(({ url, method, handler, options }) => {
      // $FlowFixMe
      const callback: HullExternalHandlerCallback = handlers[handler];
      if (callback) {
        // We want to use a manifest-configured method for the endpoint
        // $FlowFixMe
        app[method.toLowerCase()](url, actionHandler({ options, callback }));
      }
    });
    schedules.map(({ url, handler, options }) => {
      const callback: HullExternalHandlerCallback = handlers[handler];
      app.post(url, scheduleHandler({ options, callback }));
    });

    const reduceChannels = getReducer(handlers);
    batch.map(({ channels, url }) => {
      const handlers = reduceChannels(channels);
      app.post(url, batchHandler(handlers));
    });
    subscriptions.map(({ channels, url }) => {
      const handlers = reduceChannels(channels);
      app.post(url, notificationHandler(handlers));
    });

    connector.startApp(app);
    return app;
  };
};
