import Client from "hull-client";
import express from "express";
import requireHullMiddleware from "./require-hull-middleware";
import { SmartNotifierError } from "./smart-notifier-response";

import { defaultSuccessFlowControl, defaultErrorFlowControl } from "./smart-notifier-flow-controls";

function processHandlersFactory(handlers, userHandlerOptions) {
  return function process(req, res, next) {
    try {
      const { notification, client } = req.hull;
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
        req.hull.smartNotifierResponse.setFlowControl(defaultSuccessFlowControl);
        const response = req.hull.smartNotifierResponse.toJSON();
        ctx.client.logger.debug("connector.smartNotifierHandler.response", response);
        return next(new SmartNotifierError("CHANNEL_NOT_SUPPORTED", `Channel ${eventName} is not supported`));
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

      const promise = messageHandler(ctx, notification.messages);
      return promise.then(() => {
        if (!req.hull.smartNotifierResponse.isValid()) {
          req.hull.smartNotifierResponse.setFlowControl(defaultSuccessFlowControl);
        }
        const response = req.hull.smartNotifierResponse.toJSON();
        ctx.client.logger.debug("connector.smartNotifierHandler.response", response);
        return res.json(response);
      }, (err) => {
        err = err || new Error("Error while processing notification");
        err.eventName = eventName;
        err.status = err.status || 500;
        ctx.client.logger.error("connector.smartNotifierHandler.error", err.stack || err);
        if (!req.hull.smartNotifierResponse.isValid()) {
          req.hull.smartNotifierResponse.setFlowControl(defaultErrorFlowControl);
        }
        const response = req.hull.smartNotifierResponse.toJSON();
        ctx.client.logger.debug("connector.smartNotifierHandler.response", response);
        return res.status(err.status).json(response);
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


module.exports = function smartNotifierHandler({ handlers = {}, userHandlerOptions = {} }) {
  const app = express.Router();
  app.use((req, res, next) => {
    if (!req.hull.notification) {
      return next(new SmartNotifierError("MISSING_NOTIFICATION", "Missing notification object from payload"));
    }
    return next();
  });
  app.use(requireHullMiddleware());
  app.use(processHandlersFactory(handlers, userHandlerOptions));

  return app;
};
