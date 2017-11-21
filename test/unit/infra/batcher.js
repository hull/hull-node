/* global describe, it */
const Promise = require("bluebird");
const { expect } = require("chai");

const Batcher = require("../../../src/infra/batcher");

const reqStub = {
  hull: {
    ship: {
      id: "test"
    },
    client: {
      logger: {
        info: () => {},
        debug: () => {}
      }
    }
  }
};

describe("Batcher", () => {
  it("should group incoming messages", (done) => {
    Batcher
    .getHandler("test", { ctx: reqStub.hull })
    .setCallback((messages) => {
      expect(messages).to.be.eql(["test"]);
      done();
      return Promise.resolve();
    })
    .addMessage("test");
  });
});
