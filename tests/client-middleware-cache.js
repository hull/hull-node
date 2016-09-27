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

  it("can take a cachingAdapter", function (done) {
    const cacheAdapter = cacheManager.caching({ store: "memory", max: 100, ttl: 1/*seconds*/ });
    const instance = Middleware(HullStub, { hostSecret: "secret", cacheAdapter });
    instance(reqStub, {}, (err) => {
      expect(reqStub.hull.ship.private_settings.value).to.equal("test");
      const shipCache = new ShipCache(cacheAdapter);
      const newShip = {
        id: "ship_id",
        private_settings: {
          value: "test2"
        }
      };
      reqStub.hull.client.put(newShip.id, newShip)
        .then(() => {
          return shipCache.set(newShip);
        })
        .then((arg) => {
          instance(reqStub, {}, () => {
            expect(reqStub.hull.ship.private_settings.value).to.equal("test2");
            expect(this.getStub.calledOnce).to.be.true;
            done();
          });
        });
    });
  });

  it("can disable caching", function (done) {
    const cacheAdapter = cacheManager.caching({ store: "memory", isCacheableValue: () => false });
    const instance = Middleware(HullStub, { hostSecret: "secret", cacheAdapter });
    instance(reqStub, {}, () => {
      expect(reqStub.hull.ship.private_settings.value).to.equal("test");
      instance(reqStub, {}, () => {
        expect(reqStub.hull.ship.private_settings.value).to.equal("test1");
        expect(this.getStub.calledTwice).to.be.true;
        done();
      });
    });
  });
});
