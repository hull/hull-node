const _ = require("lodash");

/**
 * This plugin allows to pass generic url with variables - this allows better instrumentation and logging on the same REST API endpoint when resource ids varies.
 *
 * @public
 * @memberof Utils
 * @param  {Object} defaults default template variable
 * @return {Function} function to use as superagent plugin
 * @example
 * const superagent = require('superagent');
 * const { superagentUrlTemplatePlugin } = require('hull/lib/utils');
 *
 * const agent = superagent.agent().use(
 *   urlTemplatePlugin({
 *     defaultVariable: 'mainVariable'
 *   })
 * );
 *
 * agent
 * .get('https://api.url/{{defaultVariable}}/resource/{{resourceId}}')
 * .tmplVar({
 *   resourceId: 123
 * })
 * .then(res => {
 *   assert(res.request.url === 'https://api.url/mainVariable/resource/123');
 * });
 */
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
