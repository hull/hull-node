const _ = require("lodash");

function superagentUrlTemplatePluginFactory(defaults = {}) {
  return function superagentUrlTemplatePlugin(request) {
    const end = request.end;
    request.urlTemplateVariables = {};
    request.tmplVar = (object) => {
      _.merge(request.urlTemplateVariables, object);
      return request;
    };
    request.end = (cb) => {
      request.url = _.template(request.url, {
        interpolate: /{{([\s\S]+?)}}/g
      })(_.defaults(request.urlTemplateVariables, defaults));
      end.call(request, cb);
    };
    return request;
  };
}

module.exports = superagentUrlTemplatePluginFactory;
