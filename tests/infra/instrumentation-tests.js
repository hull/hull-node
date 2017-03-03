/* global describe, it */
import Promise from "bluebird";
import { expect } from "chai";

import Instrumentation from "../../src/infra/instrumentation";

describe("Instrumentation", () => {
  it.only("should start raven", () => {
    process.env.SENTRY_URL = "https://user:pass@sentry.io/138436";
    const instumentation = new Instrumentation();
  });
});
