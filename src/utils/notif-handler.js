import express from "express";
import https from "https";
import _ from "lodash";
import requireHullMiddleware from "./require-hull-middleware";

function subscribeFactory(options) {
  return function subscribe(req, res, next) {
    const { message } = req.hull;

    if (message.Type !== "SubscriptionConfirmation") {
      return next();
    }

    https.get(message.SubscribeURL, () => {
      if (typeof options.onSubscribe === "function") {
        options.onSubscribe(req);
      }
      return res.end("subscribed");
    }, () => {
      const e = new Error("Failed to subscribe");
      e.status = 400;
      return next(e);
    });
  };
}

function getHandlerName(eventName) {
  const ModelsMapping = {
    user_report: "user",
    users_segment: "segment"
  };
  const [modelName, action] = eventName.split(":");
  const model = ModelsMapping[modelName] || modelName;
  return `${model}:${action}`;
}

function processHandlers(handlers) {
  return function process(req, res, next) {
    try {
      const { message, notification, client, ship } = req.hull;
      const eventName = getHandlerName(message.Subject);
      const messageHandlers = handlers[eventName];
      const processing = [];

      const context = req.hull;

      if (messageHandlers && messageHandlers.length > 0) {
        messageHandlers.map((fn) => {
          return processing.push(fn(context, notification));
        });
      }

      const eventHandlers = handlers.event || [];

      if (eventHandlers.length > 0 && eventName === "report:update" && notification.message) {
        const { user, events = [], segments = [] } = notification.message;
        if (events.length > 0) {
          events.map((event) => {
            return eventHandlers.map((fn) => {
              const payload = {
                message: { user, segments, event },
                subject: "event",
                timestamp: message.Timestamp
              };
              return processing.push(fn(context, payload));
            });
          });
        }
      }

      if (processing.length > 0) {
        Promise.all(processing).then(() => {
          next();
        }, (err) => {
          err.status = err.status || 400;
          return next(err);
        });
      }
      return next();
    } catch (err) {
      err.status = 400;
      return next(err);
    }
  };
}


module.exports = function NotifHandler({ handlers = [], groupTraits, onSubscribe }) {
  const _handlers = {};
  const app = express.Router();

  function addEventHandler(evt, fn) {
    const eventName = getHandlerName(evt);
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

  app.use(requireHullMiddleware);
  app.use(subscribeFactory({ onSubscribe }));
  app.use(processHandlers(_handlers));
  app.use((req, res) => { res.end("ok"); });

  app.addEventHandler = addEventHandler;
  return app;
};
