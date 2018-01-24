/* @flow */
const { defaultErrorFlowControl } = require("./smart-notifier-flow-controls");

/**
 * FlowControl is a part of SmartNotifierResponse
 */
class SmartNotifierFlowControl {
  type: string;
  size: Number;
  in_time: Number;
  in: Number;
  at: Date;

  constructor(flowControl: Object = {}) {
    this.type = flowControl.type;
    this.size = flowControl.size;
    this.in_time = flowControl.in_time;
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

class SmartNotifierMetric {
  name: string;

  constructor(metric: Object) {
    this.name = metric.name;
  }

  toJSON() {
    return this;
  }
}

class SmartNotifierError extends Error {
  code: string;
  statusCode: number;
  reason: string;
  flowControl: Object;

  constructor(code: string, reason: string, statusCode: number = 400, flowControl: Object = defaultErrorFlowControl) {
    super(reason);

    this.code = code;
    this.statusCode = statusCode;
    this.reason = reason;
    this.flowControl = flowControl;
  }

  toJSON() {
    return { code: this.code, reason: this.reason };
  }

}

class SmartNotifierResponse {
  flowControl: SmartNotifierFlowControl;
  metrics: Array<SmartNotifierMetric>;
  errors: Array<SmartNotifierError>;

  constructor() {
    this.metrics = [];
    this.errors = [];
  }

  setFlowControl(flowControl: Object) {
    this.flowControl = new SmartNotifierFlowControl(flowControl);
    return this;
  }

  addMetric(metric: Object) {
    this.metrics.push(new SmartNotifierMetric(metric));
    return this;
  }

  addError(error: SmartNotifierError) {
    this.errors.push(error);
    return this;
  }

  isValid() {
    return this.flowControl && this.flowControl.isValid();
  }

  toJSON() {
    return {
      flow_control: this.flowControl && this.flowControl.toJSON(),
      metrics: this.metrics.map(m => m.toJSON()),
      errors: this.errors.map(err => err.toJSON())
    };
  }
}

module.exports = {
  SmartNotifierFlowControl,
  SmartNotifierMetric,
  SmartNotifierError,
  SmartNotifierResponse
};
