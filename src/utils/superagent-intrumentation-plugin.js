function superagentUnstrumentationPluginFactory({ logger, metric }) {
  return function superagentInstrumentationPlugin(request) {
    const url = request.url;
    const method = request.method;
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
      .on("response", (resData) => {
        const hrTime = process.hrtime(start);
        const status = resData.status;
        const statusGroup = `${(status).toString().substring(0, 1)}xx`;
        const elapsed = (hrTime[0] * 1000) + (hrTime[1] / 1000000);
        logger.debug("connector.service_api.call", {
          responseTime: elapsed,
          method,
          url,
          status,
          vars: request.urlTemplateVariables
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

module.exports = superagentUnstrumentationPluginFactory;
