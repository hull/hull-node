const _ = require("lodash");
const Promise = require("bluebird");

class HullStub {
  constructor(config) {
    this._configuration = config;
    this.id = _.uniqueId("ship-");
    this.logger = {
      info: console.log, //() {},
      debug: console.log, //() {}
      error: console.log
    };
  }

  get(id) { return Promise.resolve({ id }); }
  put(id) { return Promise.resolve({ id }); }
  post(id) { return Promise.resolve({ id }); }

  configuration() {
    return _.merge({ id: this.id, secret: this.secret || "shutt", organization: "xxx.hulltest.rocks" }, this._configuration);
  }
}

HullStub.logger = {
  info: console.log, // () {},
  debug: console.log, // () {}
};

module.exports = HullStub;
