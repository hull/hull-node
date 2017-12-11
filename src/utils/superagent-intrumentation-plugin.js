function superagentUnstrumentationPluginFactory({ logger, metric }) {
  return function superagentInstrumentationPlugin(request) {
    const url = request.url;
    const method = request.method;
    let start;
    request
      .on("request", () => {
        start = process.hrtime();
        // TODO: should be migrated to `connector.service_api.call`
        metric.increment("ship.service_api.call", 1, [
          `method:${method}`,
          `url:${url}`,
          `endpoint:${method} ${url}`,
        ]);
      })
      .on("response", (resData) => {
        const hrTime = process.hrtime(start);
        const elapsed = (hrTime[0] * 1000) + (hrTime[1] / 1000000);
        logger.debug("connector.service_api.call", {
          responseTime: elapsed,
          method,
          url,
          status: resData.status,
          vars: request.urlTemplateVariables
        });
        metric.value("connector.service_api.response_time", elapsed, [
          `method:${method}`,
          `url:${url}`,
          `endpoint:${method} ${url}`,
        ]);
      });
  };
}

module.exports = superagentUnstrumentationPluginFactory;
