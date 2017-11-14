/* global describe, it */
const Promise = require("bluebird");
const { expect } = require("chai");

const Instrumentation = require("../../../src/infra/instrumentation");

describe("Instrumentation", () => {
  it("should start raven", () => {
    process.env.SENTRY_URL = "https://user:pass@sentry.io/138436";
    const instrumentation = new Instrumentation();
    expect(instrumentation).to.be.an("object");
    delete process.env.SENTRY_URL;
    instrumentation.raven.uninstall();
    process.removeAllListeners("gracefulExit");
  });

  it("should handle unhandled rejection with undefined rejection reason", (done) => {
    process.on("gracefulExit", () => {
      done();
      instrumentation.raven.uninstall();
      process.removeAllListeners("gracefulExit");
    });
    process.env.SENTRY_URL = "https://user:pass@sentry.io/138436";
    const instrumentation = new Instrumentation({ exitOnError: true });
    expect(instrumentation).to.be.an("object");
    delete process.env.SENTRY_URL;
    new Promise((resolve, reject) => {
      reject();
    });
  });
});
