/* global describe, it */
const { expect } = require("chai");
const sinon = require("sinon");

const Worker = require("../../../src/connector/worker");
const HullStub = require("../support/hull-stub");

describe("Worker", () => {

  after(() => {
    process.removeAllListeners("exit");
  });

  it("should return a resolved promise for an empty job", (done) => {
    const queueStub = {
      contextMiddleware: () => (() => {}),
      adapter: {
        clean: () => {}
      }
    };
    const cacheStub = {
      contextMiddleware: () => (() => {})
    };
    const instrumentationStub = {
      contextMiddleware: () => (() => {})

    };
    const worker = new Worker({
      Hull: HullStub,
      queue: queueStub,
      instrumentation: instrumentationStub,
      cache: cacheStub
    });


    const result = worker.dispatch({
      data: {}
    });
    expect(result).to.be.promise;
    result.then(() => {
      done();
    });
  });
});
