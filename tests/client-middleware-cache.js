/* global describe, it */
import { expect, should } from "chai";
import sinon from "sinon";
import cacheManager from "cache-manager";
import jwt from "jwt-simple";

import ShipCache from "../src/ship-cache";
import Middleware from "../src/middleware/client";

import HullStub from "./support/hull-stub";

function reqStub() {
  return {
    query: {
      organization: "local",
      secret: "secret",
      ship: "ship_id"
    }
  };
}

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
    this.putStub = sinon.stub(HullStub.prototype, "put");
    this.putStub.onCall(0).returns(Promise.resolve(''));
  });

  afterEach(function afterEachHandler() {
    this.getStub.restore();
    this.putStub.restore();
  });

  it("should take a ShipCache", function (done) {
    const cacheAdapter = cacheManager.caching({ store: "memory", max: 100, ttl: 1/*seconds*/ });
    const shipCache = new ShipCache(cacheAdapter);
    const instance = Middleware(HullStub, { hostSecret: "secret", shipCache });
    const req = reqStub();
    instance(req, {}, (err) => {
      expect(req.hull.ship.private_settings.value).to.equal("test");
      const newShip = {
        private_settings: {
          value: "test2"
        }
      };

      shipCache.set("ship_id", newShip)
        .then((arg) => {
          const req2 = reqStub();
          instance(req2, {}, () => {
            expect(req2.hull.ship.private_settings.value).to.equal("test2");
            expect(this.getStub.calledOnce).to.be.true;
            expect(req2.hull.cache).to.be.equal(shipCache);
            done();
          });
        });
    });
  });

  it("should allow for disabling caching", function (done) {
    const cacheAdapter = cacheManager.caching({ store: "memory", isCacheableValue: () => false });
    const shipCache = new ShipCache(cacheAdapter);
    const instance = Middleware(HullStub, { hostSecret: "secret", shipCache });
    const req = reqStub();
    instance(req, {}, () => {
      expect(req.hull.ship.private_settings.value).to.equal("test");
      const req2 = reqStub()
      instance(req2, {}, () => {
        expect(req2.hull.ship.private_settings.value).to.equal("test1");
        expect(this.getStub.calledTwice).to.be.true;
        done();
      });
    });
  });

  it("should share the cache using the same adapter and namespace", function (done) {
    const cacheAdapter = cacheManager.caching({ store: "memory", max: 100, ttl: 1/*seconds*/ });
    const shipCache1 = new ShipCache(cacheAdapter);
    const shipCache2 = new ShipCache(cacheAdapter);
    const instance1 = Middleware(HullStub, { hostSecret: "secret", shipCache: shipCache1 });
    const instance2 = Middleware(HullStub, { hostSecret: "secret", shipCache: shipCache2 });
    const req = reqStub();
    instance1(req, {}, (err) => {
      expect(req.hull.ship.private_settings.value).to.equal("test");
      expect(this.getStub.calledOnce).to.be.true;
      const req2 = reqStub();
      instance2(req2, {}, () => {
        expect(req2.hull.ship.private_settings.value).to.equal("test");
        expect(this.getStub.calledOnce).to.be.true;
        const newShip = {
          private_settings: {
            value: "test2"
          }
        };
        shipCache1.set("ship_id", newShip)
          .then((arg) => {
            const req3 = reqStub();
            instance1(req3, {}, () => {
              expect(req3.hull.ship.private_settings.value).to.equal("test2");
              expect(this.getStub.calledOnce).to.be.true;
              const req4 = reqStub();
              instance2(req4, {}, () => {
                expect(req4.hull.ship.private_settings.value).to.equal("test2");
                expect(this.getStub.calledOnce).to.be.true;
                done();
              });
            });
          });
      });
    });
  });
});
