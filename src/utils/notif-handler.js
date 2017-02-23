import crypto from "crypto";
import express from "express";
import https from "https";
import _ from "lodash";
import requireHullMiddleware from "./require-hull-middleware";
import Batcher from "../infra/batcher";
import { group } from "../trait";

function subscribeFactory(options) {
  return function subscribe(req, res, next) {
    const { message } = req.hull;

    if (message.Type !== "SubscriptionConfirmation") {
      return next();
    }

    return https.get(message.SubscribeURL, () => {
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

function processHandlersFactory(handlers, userHandlerOptions) {
  const ns = crypto.randomBytes(64).toString("hex");
  return function process(req, res, next) {
    try {
      const { message, notification } = req.hull;
      const eventName = getHandlerName(message.Subject);
      const messageHandlers = handlers[eventName];
      const processing = [];

      const context = req.hull;

      if (messageHandlers && messageHandlers.length > 0) {
        if (message.Subject === "user_report:update") {
          if (notification.message && notification.message.user && userHandlerOptions.groupTraits) {
            notification.message.user = group(notification.message.user);
          }
          processing.push(Promise.all(messageHandlers.map((handler, i) => {
            return Batcher.getHandler(`${ns}-${eventName}-${i}`, {
              ctx: context,
              options: {
                maxSize: userHandlerOptions.maxSize || 1000,
                maxTime: userHandlerOptions.maxTime || 10000
              }
            })
            .setCallback((messages) => {
              return handler(context, messages);
            })
            .addMessage(notification.message);
          })));
        } else {
          processing.push(Promise.all(messageHandlers.map((handler) => {
            return handler(context, notification.message);
          })));
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


module.exports = function NotifHandler({ handlers = [], onSubscribe, userHandlerOptions = {} }) {
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

  app.use((req, res, next) => {
    if (!req.hull.message) {
      const e = new Error("Empty Message");
      e.status = 400;
      return next(e);
    }
    return next();
  });
  app.use(requireHullMiddleware);
  app.use(subscribeFactory({ onSubscribe }));
  app.use(processHandlersFactory(_handlers, userHandlerOptions));
  app.use((req, res) => { res.end("ok"); });

  app.addEventHandler = addEventHandler;
  return app;
};
