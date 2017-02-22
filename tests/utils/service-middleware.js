/* global describe, it */
import { expect, should } from "chai";
import sinon from "sinon";

import ServiceMiddleware from "../../src/utils/service-middleware";

class ClientClass {
  constructor(ctx) {
    this.name = "test";
    this.ctx = ctx;
  }

  get() {
    return `get.${this.ctx.service.client.name}`;
  }
}

describe("ServiceMiddleware", () => {
  it("should bind context to functions and classes", () => {
    const req = {};
    ServiceMiddleware({
      agent: {
        getData: (ctx, test) => { return `getData.${ctx.service.client.name}`; }
      },
      getOtherData: (ctx, test) => { return `getOtherData.${ctx.service.client.name}`; },
      client: ClientClass
    })(req, {}, () => {});
    expect(req.hull.service.client.get()).to.be.eql("get.test");
    expect(req.hull.service.agent.getData()).to.be.eql("getData.test");
    expect(req.hull.service.getOtherData()).to.be.eql("getOtherData.test");
  });
});
