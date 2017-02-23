/* global describe, it */
import { expect } from "chai";
import sinon from "sinon";

import HullApp from "../../src/app/hull-app";
import HullStub from "../support/hull-stub";

describe("HullApp", () => {
  it("should return an object of functions", () => {
    const app = HullApp(HullStub);
    expect(app).to.be.object;
    expect(app.server).to.be.function;
    expect(app.worker).to.be.function;
    expect(app.start).to.be.function;
  });

  it("should return a server method which returns express app", () => {
    const app = HullApp(HullStub);
    const server = app.server();
    expect(server.listen).to.be.function;
    expect(server.use).to.be.function;
    expect(server.post).to.be.function;
    expect(server.get).to.be.function;
  });

  it("should return a worker method which returns worker app", () => {
    const app = HullApp(HullStub);
    const worker = app.worker();
    expect(worker.attach).to.be.function;
    expect(worker.use).to.be.function;
    expect(worker.process).to.be.function;
  });

  it("should return a start method", () => {
    const app = HullApp(HullStub);
    const server = app.server();
    const worker = app.worker();
    app.start();
  });
});
