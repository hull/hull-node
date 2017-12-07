/* global describe, it */
const { expect, should } = require("chai");
const sinon = require("sinon");

const smartNotifierMiddleware = require("../../../src/utils/smart-notifier-middleware");


describe("SmartNotifierMiddleware", () => {
  it("should return a middleware function", () => {
    const testInstance = new smartNotifierMiddleware({});
    expect(typeof testInstance).to.equal("function");
  });
});
