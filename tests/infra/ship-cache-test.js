/* global describe, it */
import { expect } from "chai";
import sinon from "sinon";
import HullStub from "../support/hull-stub";

import ShipCache from "../../src/infra/cache/ship-cache";

describe("Enqueue", () => {
  it("should expose set, wrap, get and del methods", () => {
    const shipCache = new ShipCache({}, {});
    expect(shipCache).to.has.property("set")
      .that.is.a("function");
    expect(shipCache).to.has.property("get")
      .that.is.a("function");
    expect(shipCache).to.has.property("wrap")
      .that.is.a("function");
    expect(shipCache).to.has.property("del")
      .that.is.a("function");
  });

  it("should generate a unique hash per connector instance", () => {
    const firstShipConfig = {
      secret: "1234",
      organization: "1.hull.rocks"
    };
    const secondShipConfig = {
      secret: "5432",
      organization: "1.hull.rocks"
    };
    const hullStub = new HullStub;
    const configurationStub = sinon.stub(hullStub, "configuration")
      .onCall(0).returns(firstShipConfig)
      .onCall(1).returns(firstShipConfig)
      .onCall(2).returns(firstShipConfig)
      .onCall(3).returns(secondShipConfig)
      .onCall(4).returns(secondShipConfig);

    const shipCache = new ShipCache({ client: hullStub }, {});

    const firstShipTest = shipCache.getShipKey("test");
    const firstShipFoo = shipCache.getShipKey("foo");
    const firstShipTestAgain = shipCache.getShipKey("test");

    const secondShipTest = shipCache.getShipKey("test");
    const secondShipFoo = shipCache.getShipKey("foo");

    expect(firstShipTest).to.not.equal(firstShipFoo);
    expect(firstShipTest).to.not.equal(secondShipTest);
    expect(firstShipTest).to.not.equal(secondShipFoo);

    expect(firstShipFoo).to.not.equal(secondShipFoo);
    expect(firstShipFoo).to.not.equal(secondShipTest);

    expect(firstShipTest).to.equal(firstShipTestAgain);

    configurationStub.restore();
  });
});
