/* global describe, it */
import { expect, should } from "chai";
import sinon from "sinon";
import Promise from "bluebird";
import _ from "lodash";

import Middleware from "../src/middleware/client";
import HullStub from "./support/hull-stub";

describe("Client Middleware", () => {
  beforeEach(function beforeEachHandler() {
    this.reqStub = {
      query: {
        organization: "local",
        secret: "secret",
        ship: "ship_id"
      }
    };
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
    const instance = Middleware(HullStub, { hostSecret: "secret" });
    instance(this.reqStub, {}, () => {
      expect(this.reqStub.hull.ship.private_settings.value).to.equal("test");
      expect(this.getStub.calledOnce).to.be.true;
      done();
    });
  });

  it("should fetch ship every time without caching", function (done) {
    const instance = Middleware(HullStub, { hostSecret: "secret" });
    instance(this.reqStub, {}, () => {
      expect(this.reqStub.hull.ship.private_settings.value).to.equal("test");
      instance(this.reqStub, {}, () => {
        expect(this.reqStub.hull.ship.private_settings.value).to.equal("test1");
        expect(this.getStub.calledTwice).to.be.true;
        done();
      });
    });
  });

  it("should store a ship in cache", function (done) {
    const instance = Middleware(HullStub, { hostSecret: "secret" });
    this.reqStub.hull = {
      cache: {
        cache: false,
        wrap: function (id, cb) {
          if (this.cache) {
            return Promise.resolve(this.cache);
          }
          return cb()
            .then(ship => {
              this.cache = ship;
              return ship;
            });
        }
      }
    };
    instance(this.reqStub, {}, () => {
      expect(this.reqStub.hull.ship.private_settings.value).to.equal("test");
      instance(this.reqStub, {}, () => {
        expect(this.reqStub.hull.ship.private_settings.value).to.equal("test");
        expect(this.getStub.calledOnce).to.be.true;
        done();
      });
    });
  });

  it("should bust the cache for specific requests", function (done) {
    const instance = Middleware(HullStub, { hostSecret: "secret" });
    instance(this.reqStub, {}, () => {
      expect(this.reqStub.hull.ship.private_settings.value).to.equal("test");
      this.reqStub.hull.message = {
        Subject: "ship:update"
      };
      instance(this.reqStub, {}, () => {
        expect(this.reqStub.hull.ship.private_settings.value).to.equal("test1");
        expect(this.getStub.calledTwice).to.be.true;
        done();
      });
    });
  });

  it("should take an optional `clientConfig` param", function (done) {
    const hullSpy = sinon.stub() ;
    const instance = Middleware(hullSpy, { hostSecret: "secret", clientConfig: { flushAt: 123, connector_name: "foo" } })
    instance(this.reqStub, {}, () => {
      expect(hullSpy.calledWith({
        id: "ship_id",
        secret: "secret",
        organization: "local",
        flushAt: 123,
        connector_name: "foo"
      })).to.be.true;
      done();
    });
  });
});
