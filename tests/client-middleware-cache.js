/* global describe, it */
import { expect, should } from "chai";
import sinon from "sinon";
import cacheManager from "cache-manager";

import ShipCache from "../src/ship-cache";
import Middleware from "../src/middleware/client";

class HullStub {
  constructor() {
    this.logger = {
      info: console.log, //() {},
      debug: console.log, //() {}
    }
  }
  get() {}
  put() {}
  configuration() {
    return {
      secret: "secret",
      organization: "local"
    };
  }
}

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
    this.putStub = sinon.stub(HullStub.prototype, "put");
    this.putStub.onCall(0).returns(Promise.resolve(''));
  });

  afterEach(function afterEachHandler() {
    this.getStub.restore();
    this.putStub.restore();
  });

  it("should take a ShipCache", function (done) {
    const cacheAdapter = cacheManager.caching({ store: "memory", max: 100, ttl: 1/*seconds*/ });
    const shipCache = new ShipCache(cacheAdapter, new HullStub());
    const instance = Middleware(HullStub, { hostSecret: "secret", shipCache });
    instance(reqStub, {}, (err) => {
      expect(reqStub.hull.ship.private_settings.value).to.equal("test");
      const newShip = {
        private_settings: {
          value: "test2"
        }
      };
      shipCache.set("ship_id", newShip)
        .then((arg) => {
          instance(reqStub, {}, () => {
            expect(reqStub.hull.ship.private_settings.value).to.equal("test2");
            expect(this.getStub.calledOnce).to.be.true;
            done();
          });
        });
    });
  });

  it("should allow for disabling caching", function (done) {
    const cacheAdapter = cacheManager.caching({ store: "memory", isCacheableValue: () => false });
    const shipCache = new ShipCache(cacheAdapter, new HullStub);
    const instance = Middleware(HullStub, { hostSecret: "secret", shipCache });
    instance(reqStub, {}, () => {
      expect(reqStub.hull.ship.private_settings.value).to.equal("test");
      instance(reqStub, {}, () => {
        expect(reqStub.hull.ship.private_settings.value).to.equal("test1");
        expect(this.getStub.calledTwice).to.be.true;
        done();
      });
    });
  });

  it("should share the cache using the same adapter", function (done) {
    const cacheAdapter = cacheManager.caching({ store: "memory", max: 100, ttl: 1/*seconds*/ });
    const shipCache1 = new ShipCache(cacheAdapter, new HullStub);
    const shipCache2 = new ShipCache(cacheAdapter, new HullStub);
    const instance1 = Middleware(HullStub, { hostSecret: "secret", shipCache: shipCache1 });
    const instance2 = Middleware(HullStub, { hostSecret: "secret", shipCache: shipCache2 });
    instance1(reqStub, {}, (err) => {
      expect(reqStub.hull.ship.private_settings.value).to.equal("test");
      expect(this.getStub.calledOnce).to.be.true;
      instance2(reqStub, {}, () => {
        expect(reqStub.hull.ship.private_settings.value).to.equal("test");
        expect(this.getStub.calledOnce).to.be.true;
        const newShip = {
          private_settings: {
            value: "test2"
          }
        };
        shipCache1.set("ship_id", newShip)
          .then((arg) => {
            instance1(reqStub, {}, () => {
              expect(reqStub.hull.ship.private_settings.value).to.equal("test2");
              expect(this.getStub.calledOnce).to.be.true;
              instance2(reqStub, {}, () => {
                expect(reqStub.hull.ship.private_settings.value).to.equal("test2");
                expect(this.getStub.calledOnce).to.be.true;
                done();
              });
            });
          });
      });
    });
  });
});
