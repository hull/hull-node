const Raven = require("raven");
const metrics = require("datadog-metrics");
const dogapi = require("dogapi");
const url = require("url");
const debug = require("debug")("hull-connector:instrumentation-agent");

const MetricAgent = require("./metric-agent");

/**
 * It automatically sends data to DataDog, Sentry and Newrelic if appropriate ENV VARS are set:
 *
 * - NEW_RELIC_LICENSE_KEY
 * - DATADOG_API_KEY
 * - SENTRY_URL
 *
 * It also exposes the `contextMiddleware` which adds `req.hull.metric` agent to add custom metrics to the ship. Right now it doesn't take any custom options, but it's showed here for the sake of completeness.
 *
 * @memberof Infra
 * @public
 * @example
 * const { Instrumentation } = require("hull/lib/infra");
 *
 * const instrumentation = new Instrumentation();
 *
 * const connector = new Connector.App({ instrumentation });
 */
class InstrumentationAgent {
  constructor(options = {}) {
    this.exitOnError = options.exitOnError || false;
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
      if (!process.env.DATADOG_HOST) {
        throw new Error("To turn on Datadog integration you need to provide `DATADOG_HOST` env var");
      }
      this.metrics = metrics;
      metrics.init({
        host: process.env.DATADOG_HOST,
      });
      dogapi.initialize({ api_key: process.env.DATADOG_API_KEY });
      this.dogapi = dogapi;
    }


    if (process.env.SENTRY_URL) {
      debug("starting raven");
      this.raven = Raven.config(process.env.SENTRY_URL, {
        environment: process.env.HULL_ENV || "production",
        release: this.manifest.version,
        captureUnhandledRejections: false,
        sampleRate: parseFloat(process.env.SENTRY_SAMPLE_RATE) || 1.0
      }).install((err) => {
        console.error("connector.error", { err: err.stack || err });
        if (this.exitOnError) {
          if (process.listenerCount("gracefulExit") > 0) {
            process.emit("gracefulExit");
          } else {
            process.exit(1);
          }
        }
      });

      global.process.on("unhandledRejection", (reason, promise) => {
        const context = promise.domain && promise.domain.sentryContext;
        this.raven.captureException(reason, context || {}, () => {
          console.error("connector.error", { reason });
          if (this.exitOnError) {
            if (process.listenerCount("gracefulExit") > 0) {
              process.emit("gracefulExit");
            } else {
              process.exit(1);
            }
          }
        });
      });
    }
    this.getMetric = this.getMetric.bind(this);
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

  captureException(err = {}, extra = {}, tags = {}) {
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
    return console.error("connector.error", JSON.stringify({ message: err.message, stack: err.stack, tags }));
  }

  startMiddleware() {
    if (this.raven) {
      return Raven.requestHandler();
    }
    return (req, res, next) => {
      next();
    };
  }

  stopMiddleware() {
    if (this.raven) {
      return Raven.errorHandler();
    }
    return (req, res, next) => {
      next();
    };
  }

  getMetric(ctx) { // eslint-disable-line class-methods-use-this
    return new MetricAgent(ctx, this);
  }

  mergeContext(req) {
    const info = {
      connector: "",
      organization: ""
    };
    if (req.hull && req.hull.client) {
      const config = req.hull.client.configuration();
      info.connector = config.id;
      info.organization = config.organization;
    }
    if (this.raven) {
      Raven.mergeContext({
        tags: {
          organization: info.organization,
          connector: info.connector
        },
        extra: {
          body: req.body,
          query: req.query,
          method: req.method,
          url: url.parse(req.url).pathname,
        }
      });
    }
  }

  metricVal(metric, value = 1) {
    return (new MetricAgent({}, this)).value(metric, value);
  }
}


module.exports = InstrumentationAgent;
