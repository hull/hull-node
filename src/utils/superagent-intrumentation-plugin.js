function superagentUnstrumentationPluginFactory({ logger, metric }) {
  return function superagentInstrumentationPlugin(request) {
    const url = request.url;
    let start;
    request
      .on("request", () => {
        start = process.hrtime();
      })
      .on("response", (resData) => {
        const method = resData.request.method;
        const hrTime = process.hrtime(start);
        const elapsed = (hrTime[0] * 1000) + (hrTime[1] / 1000000);
        logger.debug("ship.service_api.request", {
          responseTime: elapsed,
          method,
          url,
          status: resData.status,
          vars: request.urlTemplateVariables
        });
        metric.value("ship.service_api.request", elapsed, [
          `method:${method}`,
          `url:${url}`,
          `status:${resData.status}`,
        ]);
      });
  };
}

module.exports = superagentUnstrumentationPluginFactory;
