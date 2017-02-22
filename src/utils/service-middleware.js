import _ from "lodash";

function isClass(fn) {
  return typeof fn === "function"
    && /^(?:class\s+|function\s+(?:_class|_default|[A-Z]))/.test(fn);
}

function bindObject(ctx, object) {
  return _.mapValues(object, (element) => {
    if (isClass(element)) {
      return new element(ctx);
    }
    if (_.isFunction(element)) {
      return element.bind(null, ctx); // req.hull
    }
    if (_.isObject(element)) {
      return bindObject(ctx, element);
    }
    return element;
  });
}



/**
 * @param  {Object} serviceDefinition
 * @return {Function}
 *
 * {
 *   functionA: (ctx, args) => { ctx.client.get("/some.stuff")},
 *   functionB: (ctx, args) => {},
 *   class: new Class { constructor(ctx) { } }
 * }
 */
export default function serviceMiddlewareFactory(serviceDefinition) {
  return function serviceMiddleware(req, res, next) {
    req.hull = req.hull || {};
    req.hull.service = bindObject(req.hull, serviceDefinition);
    next();
  };
}
