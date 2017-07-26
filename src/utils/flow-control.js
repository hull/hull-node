// @flow
export default class FlowControl {
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
}
