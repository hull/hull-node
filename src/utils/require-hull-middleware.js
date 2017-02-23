export default function requireHullClient(req, res, next) {
  if (!req.hull.client) {
    return res.status(403).send("missing credentials");
  }
  return next();
}

