// @flow

import { defaultErrorFlowControl } from "./smart-notifier-flow-controls";

/**
 * FlowControl is a part of SmartNotifierResponse
 */
export class SmartNotifierFlowControl {
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

export class SmartNotifierMetric {
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
  statusCode: number;
  reason: String;
  flowControl: Object;
  constructor: Function;
  __proto__: Object;

  constructor(code: String, reason: String, statusCode: number = 400, flowControl: Object = defaultErrorFlowControl) {
    super(reason);

    // https://github.com/babel/babel/issues/3083
    this.constructor = SmartNotifierError;
    this.__proto__ = SmartNotifierError.prototype; // eslint-disable-line no-proto
    this.code = code;
    this.statusCode = statusCode;
    this.reason = reason;
    this.flowControl = flowControl;
  }

  toJSON() {
    return { code: this.code, reason: this.reason };
  }

}
// @flow
export class SmartNotifierResponse {
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
      flow_control: this.flowControl.toJSON(),
      metrics: this.metrics.map(m => m.toJSON()),
      errors: this.errors.map(err => err.toJSON())
    };
  }
}
