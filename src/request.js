// @flow

const Client = require("hull-client");

const superagent = require("superagent");
const {
  superagentUrlTemplatePlugin,
  superagentInstrumentationPlugin,
  superagentErrorPlugin
} = require("./utils");

type Options = {
  urlTemplate: {
    [string]: any
  }
};
module.exports = (HullClient: Class<Client>) => (options: Options) =>
  superagent
    .agent()
    .use(superagentErrorPlugin())
    .use(superagentUrlTemplatePlugin(options.urlTemplate))
    .use(
      superagentInstrumentationPlugin({
        logger: HullClient.logger,
        // metric: HullClient.metric
      })
    )
    .ok(res => res.status < 500 && res.status !== 429) // we reject the promise for 5xx and 429 status codes
    .timeout({ response: 50000 })
    .retry(2);
