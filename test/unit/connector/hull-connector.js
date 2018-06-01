/* global describe, it */
const { expect } = require("chai");
const sinon = require("sinon");

const HullConnector = require("../../../src/connector/hull-connector");
const HullStub = require("../support/hull-stub");

function HullMiddlewareStub() {
  return (req, res, next) => {};
}

describe("HullConnector", () => {
  after(() => {
    process.removeAllListeners("exit");
  });

  it("should return an object of functions", () => {
    const connector = new HullConnector();
    expect(connector).to.be.object;
    expect(connector.setupApp).to.be.function;
    expect(connector.startApp).to.be.function;
    expect(connector.clientMiddleware).to.be.function;
    expect(connector.notifMiddleware).to.be.function;
    expect(connector.worker).to.be.function;
    expect(connector.startWorker).to.be.function;
  });

  it("should expose infrastucture objects", () => {
    const connector = new HullConnector();
    expect(connector.instrumentation).to.be.object;
    expect(connector.queue).to.be.object;
    expect(connector.cache).to.be.object;
  });

  it("should return a worker method which returns worker app", () => {
    const connector = new HullConnector();
    const worker = connector.worker();
    expect(worker.attach).to.be.function;
    expect(worker.use).to.be.function;
    expect(worker.process).to.be.function;
  });

  // it("should return a middleware method which returns Hull.Middleware instance", () => {
  //   const connector = new HullConnector(HullStub, HullMiddlewareStub);
  //   expect(connector.clientMiddleware).to.be.function;
  //   const middleware = connector.clientMiddleware();
  //   expect(middleware).to.be.function;
  // });

  it("should wrap express connectorlication with setupApp", () => {
    const expressMock = {
      use: () => { return this; },
      engine: () => { return this; },
      set: () => { return this; }
    };
    const connector = new HullConnector();

    connector.setupApp(expressMock);
  });

  it("should allow passing name to clientConfig and to Hull Middleware", () => {
    const middlewareSpy = sinon.spy(HullMiddlewareStub);
    const connector = new HullConnector({ connectorName: "example" });
    expect(connector.clientConfig.connectorName).to.be.eql("example");
  });

  it("should allow to set the name of internal queue", () => {
    const queue = {
      contextMiddleware: () => (() => {}),
      adapter: {
        process: () => {},
        clean: () => {}
      }
    };
    const processSpy = sinon.spy(queue.adapter, "process");

    const connector = new HullConnector({ queue });
    connector.worker();
    connector.startWorker("example");

    expect(processSpy.calledOnce).to.be.true;
    expect(processSpy.getCall(0).args[0]).to.be.equal("example");
  });

  it("should default name of internal queue to queueApp", () => {
    const queue = {
      contextMiddleware: () => (() => {}),
      adapter: {
        process: () => {},
        clean: () => {}
      }
    };
    const processSpy = sinon.spy(queue.adapter, "process");

    const connector = new HullConnector({ queue });
    connector.worker();
    connector.startWorker();

    expect(processSpy.calledOnce).to.be.true;
    expect(processSpy.getCall(0).args[0]).to.be.equal("queueApp");
  });

  it("should allow to setup custom middleware at the end of pre-handler middleware stack", () => {
    const appStub = {
      use: () => {},
      engine: () => {},
      set: () => {}
    };

    const workerStub = {
      use: () => {},
      setJobs: () => {}
    };

    const appUseSpy = sinon.spy(appStub, "use");
    const workerUseSpy = sinon.spy(workerStub, "use");

    const customMiddleware = (req, res, next) => {};
    const connector = new HullConnector();
    connector.use(customMiddleware);
    connector.setupApp(appStub);
    connector._worker = workerStub;
    connector.worker({});

    expect(appUseSpy.called).to.be.true;
    expect(appUseSpy.lastCall.args[0]).to.be.eql(customMiddleware);

    // expect(workerUseSpy.called).to.be.true;
    // expect(workerUseSpy.lastCall.args[0]).to.be.eql(customMiddleware);
  });
});
