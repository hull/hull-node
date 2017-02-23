import util from "util";
import raven from "raven";
import metrics from "datadog-metrics";
import dogapi from "dogapi";

import MetricAgent from "./metric-agent";

export default class InstrumentationAgent {

  constructor() {
    this.nr = null;
    this.raven = null;
    try {
      this.manifest = require(`${process.cwd()}/manifest.json`); // eslint-disable-line import/no-dynamic-require,global-require
    } catch (e) {
      this.manifest = {};
    }


    if (process.env.NEW_RELIC_LICENSE_KEY) {
      this.nr = require("newrelic"); // eslint-disable-line global-require
    }

    if (process.env.DATADOG_API_KEY) {
      this.metrics = metrics;
      metrics.init({
        host: process.env.HOST,
      });
      this.dogapi = dogapi;
    }


    if (process.env.SENTRY_URL) {
      console.log("starting raven");
      this.raven = new raven.Client(process.env.SENTRY_URL, {
        release: this.manifest.version
      });
      this.raven.patchGlobal();
    }

    this.middleware = this.middleware.bind(this);
  }

  startTransaction(jobName, callback) {
    if (this.nr) {
      return this.nr.createBackgroundTransaction(jobName, callback)();
    }
    return callback();
  }

  endTransaction() {
    if (this.nr) {
      this.nr.endTransaction();
    }
  }

  catchError(err, extra = {}, tags = {}) {
    if (this.raven && err) {
      this.raven.captureException(err, {
        extra,
        tags,
        fingerprint: [
          "{{ default }}",
          err.message
        ]
      });
    }
    return console.error(util.inspect(err, { depth: 10 }));
  }

  startMiddleware() {
    if (this.raven) {
      return raven.middleware.express.requestHandler(this.raven);
    }
    return (req, res, next) => {
      next();
    };
  }

  stopMiddleware() {
    if (this.raven) {
      return raven.middleware.express.errorHandler(this.raven);
    }
    return (req, res, next) => {
      next();
    };
  }

  middleware(req, res, next) {
    req.hull = req.hull || {};
    req.hull.metric = req.hull.metric || new MetricAgent(req.hull, this);
    next();
  }

  metricVal(metric, value = 1) {
    return (new MetricAgent({}, this)).value(metric, value);
  }
}
