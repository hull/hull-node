/* global describe, it */
import { expect, should } from "chai";
import sinon from "sinon";

import smartNotifierHandler from "../../../src/utils/smart-notifier-handler";


describe("SmartNotifierHandler", () => {
  it("should return an express router function", () => {
    const testInstance = new smartNotifierHandler({});
    expect(typeof testInstance).to.equal("function");
  });
});
