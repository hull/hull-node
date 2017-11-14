const _ = require("lodash");
const helpers = require("../helpers");

export default function helpersMiddlewareFactory() {
  return function helpersMiddleware(req, res, next) {
    req.hull = req.hull || {};
    req.hull.helpers = _.mapValues(helpers, func => func.bind(null, req.hull));
    next();
  };
}
