export default function requireHullClient(req, res, next) {
  if (!req.hull.client) {
    const e = new Error("Cannot initialize Hull Client - Missing Credentials");
    return res.status(403).send("missing credentials");
  }
  return next();
}

