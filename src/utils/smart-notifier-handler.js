const Client = require("hull-client");
const express = require("express");
const requireHullMiddleware = require("./require-hull-middleware");
const handleExtractFactory = require("./extract-handler-factory");
const { SmartNotifierError } = require("./smart-notifier-response");

const { defaultSuccessFlowControl, defaultErrorFlowControl, unsupportedChannelFlowControl } = require("./smart-notifier-flow-controls");

function processHandlersFactory(handlers, userHandlerOptions) {
  return function process(req, res, next) {
    try {
      const { notification, client, helpers } = req.hull;
      if (!notification || !notification.notification_id) {
        return next();
      }
      client.logger.debug("connector.smartNotifierHandler.process", {
        notification_id: notification.notification_id,
        channel: notification.channel,
        messages_count: notification.messages.length
      });
      const eventName = notification.channel;
      const messageHandler = handlers[eventName];
      const ctx = req.hull;

      // if we are dealing with `ship:update` notification
      // we clean the underlying cache
      if (notification.channel === "ship:update") {
        req.hull.cache.del(req.hull.ship.id);
      }

      if (!messageHandler) {
        // FIXME: this is a notification the connector is apparently not interested in,
        // for now we default to the "success" response to keep smart-notifier work smoothly
        req.hull.smartNotifierResponse.setFlowControl(unsupportedChannelFlowControl);
        const response = req.hull.smartNotifierResponse.toJSON();
        ctx.client.logger.debug("connector.smartNotifierHandler.response", response);
        return res.json(response);
      }

      if (notification.channel === "user:update") {
        // optionally group user traits
        if (notification.messages && userHandlerOptions.groupTraits) {
          notification.messages = notification.messages.map((message) => {
            message.user = client.utils.traits.group(message.user);
            return message;
          });
        }
      }

      // add `matchesFilter` boolean flag
      notification.messages.map((m) => {
        if (req.query.source === "connector") {
          m.matchesFilter = helpers.filterNotification(m, userHandlerOptions.segmentFilterSetting || req.hull.connectorConfig.segmentFilterSetting);
        } else {
          m.matchesFilter = true;
        }
        return m;
      });

      const promise = messageHandler(ctx, notification.messages);
      return promise.then(() => {
        if (!req.hull.smartNotifierResponse.isValid()) {
          ctx.client.logger.debug("connector.smartNotifierHandler.responseInvalid", req.hull.smartNotifierResponse.toJSON());
          req.hull.smartNotifierResponse.setFlowControl(defaultSuccessFlowControl);
        }
        const response = req.hull.smartNotifierResponse.toJSON();
        ctx.client.logger.debug("connector.smartNotifierHandler.response", response);
        return res.json(response);
      }, (err) => {
        // we enrich the response with the underlying error
        req.hull.smartNotifierResponse.addError(new SmartNotifierError("N/A", err.message));

        if (!req.hull.smartNotifierResponse.isValid()) {
          ctx.client.logger.debug("connector.smartNotifierHandler.responseInvalid", req.hull.smartNotifierResponse.toJSON());
          req.hull.smartNotifierResponse.setFlowControl(defaultErrorFlowControl);
        }
        const response = req.hull.smartNotifierResponse.toJSON();
        err = err || new Error("Error while processing notification");
        ctx.client.logger.error("connector.smartNotifierHandler.error", err.stack || err);
        ctx.client.logger.debug("connector.smartNotifierHandler.response", response);
        return res.status(err.status || 500).json(response);
      });
    } catch (err) {
      err.status = 500;
      console.error(err.stack || err);
      req.hull.smartNotifierResponse.setFlowControl(defaultErrorFlowControl);
      const response = req.hull.smartNotifierResponse.toJSON();
      Client.logger.debug("connector.smartNotifierHandler.response", response);
      return res.status(err.status).json(response);
    }
  };
}

module.exports = function smartNotifierHandler({ handlers = {}, options = {} }) {
  const app = express.Router();
  app.use(handleExtractFactory({ handlers, options }));
  app.use((req, res, next) => {
    if (!req.hull.notification) {
      return next(new SmartNotifierError("MISSING_NOTIFICATION", "Missing notification object = require( payload"));
    }
    return next();
  });
  app.use(requireHullMiddleware());
  app.use(processHandlersFactory(handlers, options));

  return app;
};
