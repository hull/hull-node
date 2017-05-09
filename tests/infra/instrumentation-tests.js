/* global describe, it */
import Promise from "bluebird";
import { expect } from "chai";
import sinon from "sinon";
import express from "express";

import Instrumentation from "../../src/infra/instrumentation";

describe("Instrumentation", () => {
  let server;

  before(() => {
    const app = express();
    app.post("/api/138436/store", () => {
      res.end("ok");
    })
    server = app.listen("8070");
  });

  after(() => {
    server.close();
  });

  it("should start raven", () => {
    process.env.SENTRY_URL = "https://user:pass@sentry.io/138436";
    const instrumentation = new Instrumentation();
    expect(instrumentation).to.be.an("object");
  });


  it("should handle unhandledRejections", (done) => {
    process.env.SENTRY_URL = "https://user:pass@localhost:8070/138436";
    const instrumentation = new Instrumentation();

    const origExit = process.exit;
    process.exit = () => {
      done();
      process.exit = origExit;
    };

    Promise.reject(new Error("test"));
  });
});
