/* global describe, it, after */
const { expect } = require("chai");
const sinon = require("sinon");
const HullConnector = require("../../../src/connector/hull-connector");
const HullStub = require("../support/hull-stub");

class WorkerStub {
  use() {}
  attach() {}
  setJobs() {}
  process() {}
}

describe("HullConnector", () => {
  after(() => {
    process.removeAllListeners("exit");
  });

  it("should throw if no config passed", () => {
    expect(() => {
      new HullConnector({ HullClient: HullStub });
    }).to.throw();
  });

  it("should return an object of functions", () => {
    const connector = new HullConnector({ HullClient: HullStub }, {});
    expect(connector.setupApp).to.be.a("function");
    expect(connector.setupRoutes).to.be.a("function");
    expect(connector.startApp).to.be.a("function");
    expect(connector.worker).to.be.a("function");
    expect(connector.startWorker).to.be.a("function");
  });

  it("should expose infrastucture objects", () => {
    const connector = new HullConnector({ HullClient: HullStub }, {});
    expect(connector.instrumentation).to.be.an("object");
    expect(connector.queue).to.be.an("object");
    expect(connector.cache).to.be.an("object");
  });

  it("should return a worker method which returns worker app", () => {
    const connector = new HullConnector({ Worker: WorkerStub }, {});
    const worker = connector.worker();
    expect(worker.attach).to.be.a("function");
    expect(worker.use).to.be.a("function");
    expect(worker.process).to.be.a("function");
  });

  // it("should return a middleware method which returns Hull.Middleware instance", () => {
  //   const connector = new HullConnector(HullStub, HullMiddlewareStub);
  //   expect(connector.clientMiddleware).to.be.a("function");
  //   const middleware = connector.clientMiddleware();
  //   expect(middleware).to.be.a("function");
  // });

  it("should wrap express application with setupApp", () => {
    const expressMock = {
      use: () => {
        return this;
      },
      engine: () => {
        return this;
      },
      set: () => {
        return this;
      }
    };
    const connector = new HullConnector({ HullClient: HullStub }, {});
    connector.setupApp(expressMock);
  });

  it("should allow passing name to clientConfig and to Hull Middleware", () => {
    const connector = new HullConnector({}, { connectorName: "example" });
    expect(connector.clientConfig.connectorName).to.be.eql("example");
  });

  it("should allow to set the name of internal queue", () => {
    const connector = new HullConnector({ Worker: WorkerStub }, {});
    connector.worker();
    const processSpy = sinon.spy(connector._worker, "process");
    connector.startWorker("example");

    expect(processSpy.calledOnce).to.be.true;
    expect(processSpy.getCall(0).args[0]).to.be.equal("example");
  });

  it("should default name of internal queue to queueApp", () => {
    const connector = new HullConnector({ Worker: WorkerStub }, {});
    connector.worker();
    const processSpy = sinon.spy(connector._worker, "process");
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
    const appUseSpy = sinon.spy(appStub, "use");
    const customMiddleware = (req, res, next) => {};
    const connector = new HullConnector(
      { HullClient: HullStub },
      {
        middlewares: [customMiddleware]
      }
    );
    connector.setupApp(appStub);
    expect(appUseSpy.called).to.be.true;
    expect(appUseSpy.firstCall.args[0]).to.be.eql(customMiddleware);
  });
});
