import express from "express";
import requireHullMiddleware from "./require-hull-middleware";
import FlowControl from "./flow-control";

const defaultSuccessFlowControl = new FlowControl({
  type: "next",
  size: 1,
  in: 1000
});

const defaultErrorFlowControl = new FlowControl({
  type: "retry",
  in: 1000
});

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

      return promise.then((resFlowControl) => {
        let flowControl = defaultSuccessFlowControl;
        if (resFlowControl instanceof FlowControl && resFlowControl.isValid()) {
          flowControl = resFlowControl;
        }
        return res.json({
          flow_control: flowControl
        });
      }, (err) => {
        err = err || new Error("Error while processing notification");
        err.eventName = eventName;
        err.status = err.status || 400;
        ctx.client.logger.error("connector.smartNotifierHandler.error", err.stack || err);
        let flowControl = defaultErrorFlowControl;
        if (err.flowControl instanceof FlowControl && err.flowControl.isValid()) {
          flowControl = err.flowControl;
        }
        return res.status(err.status).json(flowControl);
      });
    } catch (err) {
      err.status = 500;
      console.error(err.stack || err);
      return res.status(err.status).json(defaultErrorFlowControl);
    }
  };
}


module.exports = function smartNotifierHandler({ handlers = {}, userHandlerOptions = {} }) {
  const app = express.Router();
  app.use((req, res, next) => {
    if (!req.hull.notification) {
      const e = new Error("Empty Notification");
      e.status = 400;
      return next(e);
    }
    return next();
  });
  app.use(requireHullMiddleware());
  app.use(processHandlersFactory(handlers, userHandlerOptions));
  return app;
};
