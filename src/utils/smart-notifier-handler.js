import crypto from "crypto";
import express from "express";
import https from "https";
import _ from "lodash";
import requireHullMiddleware from "./require-hull-middleware";
import Batcher from "../infra/batcher";
import { group } from "../trait";

function processHandlersFactory(handlers, userHandlerOptions = {}) {
  const ns = crypto.randomBytes(64).toString("hex");
  return function process(req, res, next) {
    try {
      const { notification, helpers, connectorConfig = {} } = req.hull;
      const eventName = notification.channel;
      const messageHandlers = handlers[eventName];
      const processing = [];

      const ctx = req.hull;

      if (messageHandlers && messageHandlers.length > 0) {

        if (notification.channel === "user:update") {
          // optionally group user traits
          notification.messages.map(message => {
            if (userHandlerOptions.groupTraits) {
              message.user = group(message.user);
            }
            message.matchesFilter = helpers.filterNotification(message, userHandlerOptions.segmentFilterSetting || connectorConfig.segmentFilterSetting);
            // add `matchesFilter` boolean flag
            return message;
          });
          return handler(ctx, notification.messages);
        } else {
          processing.push(Promise.all(messageHandlers.map((handler) => {
            return handler(ctx, notification.messages);
          })));
        }
      }

      if (processing.length > 0) {
        Promise.all(processing).then(() => {
          next();
        }, (err) => {
          err = err || new Error("Error while processing notification");
          err.eventName = eventName;
          err.status = err.status || 400;
          ctx.client.logger.error("notifHandler.err", err.stack || err);
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

module.exports = function smartNotifierHandler({ handlers = {}, userHandlerOptions = {} }) {
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
    if (!req.hull.notification) {
      const e = new Error("Empty Notification");
      e.status = 400;
      return next(e);
    }
    return next();
  });
  app.use(requireHullMiddleware());
  app.use(processHandlersFactory(_handlers, userHandlerOptions));
  app.use((req, res) => { res.end("ok"); });

  app.addEventHandler = addEventHandler;
  return app;
};
