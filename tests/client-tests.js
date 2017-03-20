/* global describe, it */
import { expect } from "chai";
import sinon from "sinon";
import jwt from "jwt-simple";

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

  describe("as", () => {
    it("should allow to pass create option", () => {
      const hull = new Hull({ id: "562123b470df84b740000042", secret: "1234", organization: "test" });

      const scoped = hull.asUser({ email: "foo@bar.com" }, { create: false });
      const scopedConfig = scoped.configuration();
      const scopedJwtClaims = jwt.decode(scopedConfig.accessToken, scopedConfig.secret);
      expect(scopedJwtClaims)
        .to.have.property("io.hull.create")
        .that.eql(false);
      expect(scopedJwtClaims)
        .to.have.property("io.hull.asUser")
        .that.eql({ email: "foo@bar.com" });
    });

    it("should allow to pass user id as a string", () => {
      const hull = new Hull({ id: "562123b470df84b740000042", secret: "1234", organization: "test" });

      const scoped = hull.asUser("123456");
      const scopedConfig = scoped.configuration();
      const scopedJwtClaims = jwt.decode(scopedConfig.accessToken, scopedConfig.secret);
      expect(scopedJwtClaims)
        .to.have.property("sub")
        .that.eql("123456");
    });

    it("should allow to pass account id as an object property", () => {
      const hull = new Hull({ id: "562123b470df84b740000042", secret: "1234", organization: "test" });

      const scoped = hull.asAccount({ id: "123456" });
      const scopedConfig = scoped.configuration();
      const scopedJwtClaims = jwt.decode(scopedConfig.accessToken, scopedConfig.secret);
      expect(scopedJwtClaims)
        .to.have.property("sub")
        .that.eql("123456");
    });

    it("should allow to pass account name as an object property", () => {
      const hull = new Hull({ id: "562123b470df84b740000042", secret: "1234", organization: "test" });

      const scoped = hull.asAccount({ name: "Hull" });
      const scopedConfig = scoped.configuration();
      const scopedJwtClaims = jwt.decode(scopedConfig.accessToken, scopedConfig.secret);
      expect(scopedJwtClaims)
        .to.have.property("io.hull.asAccount")
        .that.eql({ name: "Hull" });
    });
  });
});
