export default function requireHullClient(req, res, next) {
  if (!req.hull.client) {
    const e = new Error("Cannot initialize Hull Client - Missing Credentials");
    e.status = 400;
    return next(e);
  }
  return next();
}

