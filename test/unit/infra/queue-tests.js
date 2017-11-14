/* global describe, it */
const { expect } = require("chai");
const sinon = require("sinon");
const HullStub = require("../support/hull-stub");

const enqueue = require("../../../src/infra/queue/enqueue");

describe("Enqueue", () => {
  it("should allow custom queue name", () => {
    const queueAdapter = {
      create: () => {}
    };
    const createSpy = sinon.spy(queueAdapter, "create");
    enqueue(queueAdapter, {
      client: new HullStub
    }, "test", { payload: "test" }, { queueName: "example"});
    expect(createSpy.calledOnce).to.be.true;
    expect(createSpy.getCall(0).args[0]).to.be.equal("example");
  });

  it("should default to queuApp queue name", () => {
    const queueAdapter = {
      create: () => {}
    };
    const createSpy = sinon.spy(queueAdapter, "create");
    enqueue(queueAdapter, {
      client: new HullStub
    }, "test");
    expect(createSpy.calledOnce).to.be.true;
    expect(createSpy.getCall(0).args[0]).to.be.equal("queueApp");
  });
});
