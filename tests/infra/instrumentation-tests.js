/* global describe, it */
import Promise from "bluebird";
import { expect } from "chai";

import Instrumentation from "../../src/infra/instrumentation";

describe("Instrumentation", () => {
  it("should start raven", () => {
    process.env.SENTRY_URL = "https://user:pass@sentry.io/138436";
    const instrumentation = new Instrumentation();
    expect(instrumentation).to.be.an("object");
    delete process.env.SENTRY_URL;
  });

  it.only("should handle uncought errors", (done) => {
    const originalExit = process.exit;
    process.exit = (arg) => {
      console.log("process.exit", arg)
      process.exit = originalExit;
      done();
    };
    process.env.SENTRY_URL = "https://user:pass@sentry.io/138436";
    const instrumentation = new Instrumentation();
    expect(instrumentation).to.be.an("object");
    delete process.env.SENTRY_URL;
    new Promise((resolve, reject) => {
      reject();
    })
  });
});
