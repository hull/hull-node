import express from "express";
import _ from "lodash";
import requireHullMiddleware from "./require-hull-middleware";

function processHandlersFactory(handlers) {
  return function process(req, res, next) {
    try {
      const { notification, client } = req.hull;
      client.logger.debug("connector.smartNotifierHandler.process", {
        notification_id: notification.notification_id,
        channel: notification.channel,
        messages_count: notification.messages.length
      });
      const eventName = notification.channel;
      const messageHandlers = handlers[eventName];
      const processing = [];

      const ctx = req.hull;

      processing.push(Promise.all(messageHandlers.map((handler) => {
        return handler(ctx, notification.messages);
      })));

      if (processing.length > 0) {
        Promise.all(processing).then(() => {
          next();
        }, (err) => {
          err = err || new Error("Error while processing notification");
          err.eventName = eventName;
          err.status = err.status || 400;
          ctx.client.logger.error("connector.smartNotifierHandler.error", err.stack || err);
          return next(err);
        });
      }
      return next();
    } catch (err) {
      err.status = 400;
      console.error(err.stack || err);
      return next(err);
    }
  };
}


module.exports = function smartNotifierHandler({ handlers = {} }) {
  const _handlers = {};
  const app = express.Router();

  function addEventHandler(eventName, fn) {
    _handlers[eventName] = _handlers[eventName] || [];
    _handlers[eventName].push(fn);
    return this;
  }

  function addEventHandlers(eventsHash) {
    _.map(eventsHash, (fn, eventName) => addEventHandler(eventName, fn));
    return this;
  }

  if (handlers) {
    addEventHandlers(handlers);
  }
  app.use((req, res, next) => {
    if (!req.hull.message) {
      const e = new Error("Empty Message");
      e.status = 400;
      return next(e);
    }
    return next();
  });
  app.use(requireHullMiddleware());
  app.use(processHandlersFactory(_handlers));
  app.use((req, res) => { res.end("ok"); });
  return app;
};
