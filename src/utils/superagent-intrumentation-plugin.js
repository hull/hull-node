/**
 * This plugin takes `client.logger` and `metric` params from the `Context Object` and logs following log line:
 * - `ship.service_api.request` with params:
 *   - `url` - the original url passed to agent (use with `superagentUrlTemplatePlugin`)
 *   - `responseTime` - full response time in ms
 *   - `method` - HTTP verb
 *   - `status` - response status code
 *   - `vars` - when using `superagentUrlTemplatePlugin` it will contain all provided variables
 *
 * The plugin also issue a metric with the same name `ship.service_api.request`.
 *
 * @public
 * @memberof Utils
 * @name superagentInstrumentationPlugin
 * @param  {Object}   options
 * @param  {Object}   options.logger Logger from HullClient
 * @param  {Object}   options.metric Metric from Hull.Connector
 * @return {Function} function to use as superagent plugin
 * @example
 * const superagent = require('superagent');
 * const { superagentInstrumentationPlugin } = require('hull/lib/utils');
 *
 * // const ctx is a Context Object here
 *
 * const agent = superagent
 * .agent()
 * .use(
 *   urlTemplatePlugin({
 *     defaultVariable: 'mainVariable'
 *   })
 * )
 * .use(
 *   superagentInstrumentationPlugin({
 *     logger: ctx.client.logger,
 *     metric: ctx.metric
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
 *
 * > Above code will produce following log line:
 * ```sh
 * connector.service_api.call {
 *   responseTime: 880.502444,
 *   method: 'GET',
 *   url: 'https://api.url/{{defaultVariable}}/resource/{{resourceId}}',
 *   status: 200
 * }
 * ```
 *
 * > and following metrics:
 *
 * ```javascript
 * - `ship.service_api.call` - should be migrated to `connector.service_api.call`
 * - `connector.service_api.responseTime`
 * ```
 */
function superagentInstrumentationPluginFactory({ logger, metric }) {
  return function superagentInstrumentationPlugin(request) {
    const { method, url } = request;
    let start;
    request
      .on("request", () => {
        start = process.hrtime();
      })
      .on("error", () => {
        metric.increment("connector.service_api.error", 1, [
          `method:${method}`,
          `url:${url}`,
          `endpoint:${method} ${url}`,
        ]);
      })
      .on("response", resData => {
        const hrTime = process.hrtime(start);
        const { status } = resData;
        const statusGroup = `${status.toString().substring(0, 1)}xx`;
        const elapsed = hrTime[0] * 1000 + hrTime[1] / 1000000;
        logger.debug("connector.service_api.call", {
          responseTime: elapsed,
          method,
          url,
          status,
          vars: request.urlTemplateVariables,
        });
        // TODO: should be migrated to `connector.service_api.call`
        metric.increment("ship.service_api.call", 1, [
          `method:${method}`,
          `url:${url}`,
          `status:${status}`,
          `statusGroup:${statusGroup}`,
          `endpoint:${method} ${url}`,
        ]);
        metric.value("connector.service_api.response_time", elapsed, [
          `method:${method}`,
          `url:${url}`,
          `status:${status}`,
          `statusGroup:${statusGroup}`,
          `endpoint:${method} ${url}`,
        ]);
      });
  };
}

module.exports = superagentInstrumentationPluginFactory;
