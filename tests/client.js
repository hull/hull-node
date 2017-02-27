/* global describe, it */
import { expect } from "chai";
import sinon from "sinon";

import Hull from "../src";

describe("Hull", () => {
  it("should expose bound Connector", () => {
    const connector = new Hull.Connector({ hostSecret: 1234 });
    expect(connector).to.be.object;
    expect(connector.hostSecret).to.be.eql(1234);
  });
});
