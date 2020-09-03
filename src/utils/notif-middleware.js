const bodyParser = require("body-parser");
const MessageValidator = require("sns-validator");
const _ = require("lodash");

/**
 * @return {Function}
 */
module.exports = function notifMiddlewareFactory() {
  const validator = new MessageValidator(/sns\.us-east-1\.amazonaws\.com/, "utf8");

  function verify(req, res, next) {
    if (!req.hull.message) {
      return next();
    }

    return validator.validate(req.hull.message, function validate(err) {
      if (err) {
        console.warn("Invalid signature error", req.hull.message);
      }

      const { message } = req.hull;

      if (message.Type === "SubscriptionConfirmation") {
        return next();
      } else if (message.Type === "Notification") {
        try {
          const payload = JSON.parse(message.Message);
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
  }

  return function notifMiddleware(req, res, next) {
    req.hull = req.hull || {};
    if (!req.hull.requestId && req.headers["x-amz-sns-message-id"]) {
      const appId = _.last((req.headers["x-amz-sns-topic-arn"] || "").split("-"));
      const timestamp = Math.floor(new Date().getTime() / 1000);
      req.hull.requestId = ["sns-notifier", appId, timestamp, req.headers["x-amz-sns-message-id"]].join(":");
    }
    if (req.headers["x-amz-sns-message-type"] || req.url.match("/batch")) {
      req.headers["content-type"] = "application/json;charset=UTF-8";
      bodyParser.json({ limit: "20mb" })(req, res, () => {
        if (req.body && req.body.Message && req.body.Type) {
          req.hull.message = req.body;
        }
        verify(req, res, next);
      });
    } else {
      next();
    }
  };
};
