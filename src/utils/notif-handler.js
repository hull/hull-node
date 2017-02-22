import MessageValidator from "sns-validator";
import express from "express";
import https from "https";
import _ from "lodash";
import rawBody from "raw-body";
import { group } from "../trait";
import requireHullMiddleware from "./require-hull-middleware";

function parseRequest(req, res, next) {
  req.hull = req.hull || {};
  rawBody(req, true, (err, body) => {
    if (err) {
      const e = new Error("Invalid Body");
      e.status = 400;
      return next(e);
    }
    try {
      req.hull.message = JSON.parse(body);
    } catch (parseError) {
      const e = new Error("Invalid Body");
      e.status = 400;
      return next(e);
    }
    return next();
  });
}

function verifySignature(options = {}) {
  const validator = new MessageValidator(/sns\.us-east-1\.amazonaws\.com/, "utf8");

  return function verify(req, res, next) {
    if (!req.hull.message) {
      const e = new Error("Empty Message");
      e.status = 400;
      return next(e);
    }

    validator.validate(req.hull.message, function validate(err) {
      if (err) {
        if (options.enforceValidation) {
          err.status = 400;
          return next(err);
        }
        console.warn("Invalid signature error", req.hull.message);
      }

      const { message } = req.hull;

      if (message.Type === "SubscriptionConfirmation") {
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
      } else if (message.Type === "Notification") {
        try {
          const payload = JSON.parse(message.Message);
          if (payload && payload.user && options.groupTraits) {
            payload.user = group(payload.user);
          }

          req.hull.notification = {
            subject: message.Subject,
            message: payload,
            timestamp: new Date(message.Timestamp)
          };
          return next();
        } catch (error) {
          const e = new Error("Invalid Message");
          e.status = 400;
          return next(e);
        }
      }
      return next();
    });
    return next();
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

      const context = {
        req,
        ship,
        hull: client
      };

      if (messageHandlers && messageHandlers.length > 0) {
        messageHandlers.map((fn) => {
          return processing.push(fn(notification, context));
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
              return processing.push(fn(payload, context));
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
  app.use(parseRequest);
  app.use(verifySignature({
    onSubscribe,
    enforceValidation: false,
    groupTraits: groupTraits !== false
  }));
  app.use(processHandlers(_handlers));
  app.use((req, res) => { res.end("ok"); });

  app.addEventHandler = addEventHandler;
  return app;
};
