// @flow
import type { HullContextFull } from "../../types";

const _ = require("lodash");
const debug = require("debug")("hull-connector:metric-agent");

/**
 * Metric agent available as `req.hull.metric` object.
 * This class is being initiated by InstrumentationAgent.
 * If you want to change or override metrics behavior please @see Infra.InstrumentationAgent
 *
 * @public
 * @name metric
 * @memberof Context
 * @example
 * req.hull.metric.value("metricName", metricValue = 1);
 * req.hull.metric.increment("metricName", incrementValue = 1); // increments the metric value
 * req.hull.metric.event("eventName", { text = "", properties = {} });
 */
class MetricAgent {
  ctx: HullContextFull;

  manifest: Object;

  dogapi: Object;

  logFunction: Function;

  metrics: Object;

  mergeContext: Function;

  captureException: Function;

  _captureException: Function;

  constructor(ctx: HullContextFull, instrumentationAgent: Object) {
    this.mergeContext = instrumentationAgent.mergeContext.bind(
      instrumentationAgent
    );
    this._captureException = instrumentationAgent.captureException.bind(
      instrumentationAgent
    );
    this.metrics = instrumentationAgent.metrics;
    this.dogapi = instrumentationAgent.dogapi;
    this.manifest = instrumentationAgent.manifest;
    this.ctx = ctx;
    this.logFunction = process.env.CONNECTOR_METRIC_LOGS
      ? _.get(ctx, "client.logger.debug", debug)
      : () => {};
  }

  /**
   * Sets metric value for gauge metric
   * @public
   * @memberof Context.metric
   * @param  {string} metric metric name
   * @param  {number} value metric value
   * @param  {Array}  [additionalTags=[]] additional tags in form of `["tag_name:tag_value"]`
   * @return {mixed}
   */
  value(metric: string, value: number = 1, additionalTags: Array<string> = []) {
    this.logFunction("metric.value", { metric, value, additionalTags });
    if (!this.metrics) {
      return null;
    }
    try {
      return this.metrics.gauge(
        metric,
        parseFloat(value),
        _.union(this.getMetricTagsArray(), additionalTags)
      );
    } catch (err) {
      console.warn("metricVal.error", err); //eslint-disable-line no-console
    }
    return null;
  }

  /**
   * Increments value of selected metric
   * @public
   * @memberof Context.metric
   * @param  {string} metric metric metric name
   * @param  {number} value value which we should increment metric by
   * @param  {Array}  [additionalTags=[]] additional tags in form of `["tag_name:tag_value"]`
   * @return {mixed}
   */
  increment(
    metric: string,
    value: number = 1,
    additionalTags: Array<string> = []
  ) {
    this.logFunction("metric.increment", { metric, value, additionalTags });
    if (!this.metrics) {
      return null;
    }
    try {
      return this.metrics.increment(
        metric,
        parseFloat(value),
        _.union(this.getMetricTagsArray(), additionalTags)
      );
    } catch (err) {
      console.warn("metricInc.error", err); //eslint-disable-line no-console
    }
    return null;
  }

  /**
   * @public
   * @memberof Context.metric
   * @param  {string} title
   * @param  {string} [text]
   * @param  {Object} [properties={}]
   * @return {mixed}
   */
  event(title: string, text: string = "", properties: Object = {}) {
    this.logFunction("metric.event", { title, text, properties });
    if (!this.dogapi) {
      return null;
    }
    return this.dogapi.event.create(
      `${this.manifest.name}.${title}`,
      text,
      _.merge({}, properties, {
        tags: this.getMetricTagsArray(),
      })
    );
  }

  captureException(err: Error, extra: Object = {}, tags: Object = {}) {
    return this._captureException(
      err,
      extra,
      _.merge({}, this.getMetricTagsObject(), tags)
    );
  }

  getMetricTagsObject() {
    const { organization = "none", id = "none" } =
      this.ctx.client !== undefined ? this.ctx.client.configuration() : {};
    const hullHost = organization
      .split(".")
      .slice(1)
      .join(".");
    const tags = {
      source: "ship",
      ship_version: this.manifest.version,
      connector_version: this.manifest.version,
      ship_name: this.manifest.name,
      connector_name: this.manifest.name,
      ship_env: process.env.NODE_ENV || "production",
      connector_env: process.env.NODE_ENV || "production",
      hull_env: process.env.HULL_ENV || "production",
      hull_host: hullHost,
      organization,
      ship: id,
      connector: id,
      handler_name: this.ctx.handlerName || "none",
    };
    return tags;
  }

  getMetricTagsArray() {
    const tagsObject = this.getMetricTagsObject();
    return _.toPairs(tagsObject).map(([key, value]) => `${key}:${value}`);
  }
}

module.exports = MetricAgent;
