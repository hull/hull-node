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
        metric.value("connector.service_api.responseTime", elapsed, [
          `method:${method}`,
          `url:${url}`,
          `status:${resData.status}`,
        ]);
      });
  };
}

module.exports = superagentUnstrumentationPluginFactory;
