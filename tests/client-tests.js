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

  it("should expose helper functions", () => {
    const hull = new Hull({ id: "562123b470df84b740000042", secret: "1234", organization: "test" });
    expect(hull.utils.extract).to.has.property("request")
      .that.is.an("function");
    expect(hull.utils.extract).to.has.property("handle")
      .that.is.an("function");
    expect(hull.utils.properties).to.has.property("get")
      .that.is.an("function");
    expect(hull.utils.settings).to.has.property("update")
      .that.is.an("function");
  });
});
