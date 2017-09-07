// @flow
export class FlowControl {
  type: String;
  size: Number;
  in: Number;
  at: Date;

  constructor(flowControl: Object = {}) {
    this.type = flowControl.type;
    this.size = flowControl.size;
    this.in = flowControl.in;
    this.at = flowControl.at;
  }

  isValid() {
    if (!this.type) {
      return false;
    }
    if (!this.in && !this.at) {
      return false;
    }
    return true;
  }

  toJSON() {
    return this;
  }
}

export class Metric {
  name: String;

  constructor(metric: Object) {
    this.name = metric.name;
  }

  toJSON() {
    return this;
  }
}

export class SmartNotifierError extends Error {
  code: String;
  reason: String;
  flowControl: Object;
  // TODO this is a hack to make instanceof work
  isSmartNotifierError: boolean;

  constructor(code: String, reason: String, flowControl = require("./smart-notifier-flow-controls").defaultErrorFlowControl) {
    super(reason);
    this.code = code;
    this.reason = reason;
    this.flowControl = flowControl;
    this.isSmartNotifierError = true;
  }

}
// @flow
export default class SmartNotifierResponse {
  flowControl: FlowControl;
  metrics: Array<Metric>;
  errors: Array<SmartNotifierError>;

  constructor() {
    this.metrics = [];
    this.errors = [];
  }

  setFlowControl(flowControl: Object) {
    this.flowControl = new FlowControl(flowControl);
    return this;
  }

  addMetric(metric: Object) {
    this.metrics.push(new Metric(metric));
    return this;
  }

  addError(error: Object) {
    this.errors.push(error);
    return this;
  }

  isValid() {
    return this.flowControl && this.flowControl.isValid();
  }

  toJSON() {
    return {
      flow_control: this.flowControl.toJSON(),
      metrics: this.metrics.map(m => m.toJSON()),
      errors: this.errors.map(err => { return { code: err.code, reason: err.reason }; })
    };
  }
}
