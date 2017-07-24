/* global describe, it */
import Promise from "bluebird";
import { expect } from "chai";

import Batcher from "../../../src/infra/batcher";

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
