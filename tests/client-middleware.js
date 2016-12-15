/* global describe, it */
import { expect, should } from "chai";
import sinon from "sinon";

import Middleware from "../src/middleware/client";
import HullStub from "./support/hull-stub";

const reqStub = {
  query: {
    organization: "local",
    secret: "secret",
    ship: "ship_id"
  }
};

describe("Client Middleware", () => {
  beforeEach(function beforeEachHandler() {
    this.getStub = sinon.stub(HullStub.prototype, "get");
    this.getStub.onCall(0).returns(Promise.resolve({
        id: "ship_id",
        private_settings: {
          value: "test"
        }
      }))
      .onCall(1).returns(Promise.resolve({
        id: "ship_id",
        private_settings: {
          value: "test1"
        }
      }));
  });

  afterEach(function afterEachHandler() {
    this.getStub.restore();
  });

  it("needs hostSecret option", () => {
    expect(() => {
      return Middleware(HullStub);
    }).to.throw(TypeError);

    expect(() => {
      return Middleware(HullStub, { hostSecret: "secret" });
    }).to.not.throw(TypeError);
  });

  it("should return a middleware function", () => {
    const instance = Middleware(HullStub, { hostSecret: "secret" });
    const next = sinon.spy();
    instance({}, {}, next);
    expect(next.calledOnce).to.be.true;
  });

  it("should fetch a ship", function (done) {
    const instance = Middleware(HullStub, { hostSecret: "secret", fetchShip: true });
    instance(reqStub, {}, () => {
      expect(reqStub.hull.ship.private_settings.value).to.equal("test");
      expect(this.getStub.calledOnce).to.be.true;
      done();
    });
  });

  it("should fetch ship every time without caching", function (done) {
    const instance = Middleware(HullStub, { hostSecret: "secret", fetchShip: true, cacheShip: false });
    instance(reqStub, {}, () => {
      expect(reqStub.hull.ship.private_settings.value).to.equal("test");
      instance(reqStub, {}, () => {
        expect(reqStub.hull.ship.private_settings.value).to.equal("test1");
        expect(this.getStub.calledTwice).to.be.true;
        done();
      });
    });
  });

  it("should store a ship in cache", function (done) {
    const instance = Middleware(HullStub, { hostSecret: "secret", fetchShip: true, cacheShip: true });
    instance(reqStub, {}, () => {
      expect(reqStub.hull.ship.private_settings.value).to.equal("test");
      instance(reqStub, {}, () => {
        expect(reqStub.hull.ship.private_settings.value).to.equal("test");
        expect(this.getStub.calledOnce).to.be.true;
        done();
      });
    });
  });

  it("should bust the cache for specific requests", function (done) {
    const instance = Middleware(HullStub, { hostSecret: "secret", fetchShip: true, cacheShip: true });
    instance(reqStub, {}, () => {
      expect(reqStub.hull.ship.private_settings.value).to.equal("test");
      reqStub.hull.message = {
        Subject: "ship:update"
      };
      instance(reqStub, {}, () => {
        expect(reqStub.hull.ship.private_settings.value).to.equal("test1");
        expect(this.getStub.calledTwice).to.be.true;
        done();
      });
    });
  });
});
