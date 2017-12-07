/* global describe, it */
const { expect, should } = require("chai");
const sinon = require("sinon");

const smartNotifierHandler = require("../../../src/utils/smart-notifier-handler");


describe("SmartNotifierHandler", () => {
  it("should return an express router function", () => {
    const testInstance = new smartNotifierHandler({});
    expect(typeof testInstance).to.equal("function");
  });
});
