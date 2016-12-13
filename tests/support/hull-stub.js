import _ from "lodash";
import Promise from "bluebird";

export default class HullStub {
  constructor() {
    this.id = _.uniqueId('ship-');
    this.logger = {
      info: console.log, //() {},
      debug: console.log, //() {}
    }
  }

  get(id) { return Promise.resolve({ id }); }
  put(id) { return Promise.resolve({ id }); }

  configuration() {
    return { id: this.id , secret: "shutt", organization: "xxx.hulltest.rocks" };
  }

}
