import rawBody from "raw-body";
import MessageValidator from "sns-validator";

/**
 * @param  {Object}   req
 * @param  {Object}   res
 * @param  {Function} next
 */
export default function notifMiddlewareFactory() {
  const validator = new MessageValidator(/sns\.us-east-1\.amazonaws\.com/, "utf8");

  return function notifMiddleware(req, res, next) {
    parseRequest(req, res, () => {
      verify(req, res, next);
    });
  }

  function parseRequest(req, res, next) {
    req.hull = req.hull || {};
    rawBody(req, true, (err, body) => {
      if (err) {
        const e = new Error("Invalid Body");
        e.status = 400;
        return next(e);
      }
      try {
        const parsedBody = JSON.parse(body);
        if (parsedBody.Message, parsedBody.Subject, parsedBody.Timestamp) {
          req.hull.message = parsedBody;
        } else {
          req.body = parsedBody;
        }
      } catch (parseError) {
        const e = new Error("Invalid Body");
        e.status = 400;
        return next(e);
      }
      return next();
    });
  }


  function verify(req, res, next) {
    if (!req.hull.message) {
      return next();
    }

    validator.validate(req.hull.message, function validate(err) {
      if (err) {
        console.warn("Invalid signature error", req.hull.message);
      }

      const { message } = req.hull;

      if (message.Type === "SubscriptionConfirmation") {
        return next()
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
}
