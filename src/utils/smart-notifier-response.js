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

// @flow
export default class SmartNotifierResponse {
  flowControl: FlowControl;
  metrics: Array<Metric>

  constructor() {
    this.metrics = [];
  }

  setFlowControl(flowControl: Object) {
    this.flowControl = new FlowControl(flowControl);
    return this;
  }

  addMetric(metric: Object) {
    this.metrics.push(new Metric(metric));
    return this;
  }

  isValid() {
    return this.flowControl && this.flowControl.isValid();
  }

  toJSON() {
    return {
      flow_control: this.flowControl.toJSON(),
      metrics: this.metrics.map(m => m.toJSON())
    };
  }
}
