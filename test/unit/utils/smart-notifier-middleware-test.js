/* global describe, it */
import { expect, should } from "chai";
import sinon from "sinon";

import smartNotifierMiddleware from "../../../src/utils/smart-notifier-middleware";


describe("SmartNotifierMiddleware", () => {
  it("should return a middleware function", () => {
    const testInstance = new smartNotifierMiddleware({});
    expect(typeof testInstance).to.equal("function");
  });
});
