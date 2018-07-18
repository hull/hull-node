/* global describe, it */
const { expect, should } = require("chai");
const sinon = require("sinon");

const notificationHandler = require("../../../src/handlers/notification-handler");


describe("notificationHandler", () => {
  it("should return an express router function", () => {
    const testInstance = notificationHandler({ HullClient: {} }, {});
    expect(typeof testInstance).to.equal("function");
  });
});
