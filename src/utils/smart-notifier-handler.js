import express from "express";
import requireHullMiddleware from "./require-hull-middleware";

function processHandlersFactory(handlers, userHandlerOptions, defaultFlowControl) {
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

      return promise.then((flowControl) => {
        if (!flowControl) {
          flowControl = defaultFlowControl;
        }
        return res.json({
          flow_control: flowControl
        });
      }, (err) => {
        err = err || new Error("Error while processing notification");
        err.eventName = eventName;
        err.status = err.status || 400;
        ctx.client.logger.error("connector.smartNotifierHandler.error", err.stack || err);
        return res.status(err.status).end("error");
      });
    } catch (err) {
      err.status = 400;
      console.error(err.stack || err);
      return res.status(err.status).end("error");
    }
  };
}


module.exports = function smartNotifierHandler({ handlers = {}, userHandlerOptions = {}, defaultFlowControl = {} }) {
  const app = express.Router();
  app.use((req, res, next) => {
    if (!req.hull.message) {
      const e = new Error("Empty Message");
      e.status = 400;
      return next(e);
    }
    return next();
  });
  app.use(requireHullMiddleware());
  app.use(processHandlersFactory(handlers, userHandlerOptions, defaultFlowControl));
  return app;
};
