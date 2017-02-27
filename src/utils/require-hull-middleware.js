export default function requireHullMiddlewareFactory() {
  return function requireHullMiddleware(req, res, next) {
    if (!req.hull.client) {
      return res.status(403).send("Missing credentials. Set one of token or hullToken or set of id, organization, secret");
    }
    return next();
  };
}
