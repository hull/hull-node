/* global describe, it */
const { expect, should } = require("chai");
const sinon = require("sinon");
const cacheManager = require("cache-manager");
const jwt = require("jwt-simple");
const _ = require("lodash");

const Middleware = require("../../src/middleware/client");
const { Cache } = require("../../src/infra");

const HullStub = require("../unit/support/hull-stub");

let reqStub;

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
    reqStub = {
      query: {
        organization: "local",
        secret: "secret",
        ship: "ship_id"
      }
    };
  });

  afterEach(function afterEachHandler() {
    this.getStub.restore();
    this.putStub.restore();
  });

  it("should take a ShipCache", function (done) {
    const cache = new Cache({ store: "memory", max: 100, ttl: 1/*seconds*/ });
    cache.workspaceMiddleware()(reqStub, {}, () => {});
    const instance = Middleware(HullStub, { hostSecret: "secret"});
    instance(reqStub, {}, (err) => {
      expect(reqStub.hull.ship.private_settings.value).to.equal("test");
      const newShip = {
        private_settings: {
          value: "test2"
        }
      };

      reqStub.hull.workspaceCache.set("ship_id", newShip)
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
    const cache = new Cache({ store: "memory", isCacheableValue: () => false });

    cache.workspaceMiddleware()(reqStub, {}, () => {});
    const instance = Middleware(HullStub, { hostSecret: "secret" });
    instance(reqStub, {}, () => {
      expect(reqStub.hull.ship.private_settings.value).to.equal("test");
      instance(reqStub, {}, () => {
        expect(reqStub.hull.ship.private_settings.value).to.equal("test1");
        expect(this.getStub.calledTwice).to.be.true;
        done();
      });
    });
  });

  it("should call the API only once even for multiple concurrent inits", function (done) {
    const cache = new Cache({ store: "memory", max: 100, ttl: 1/*seconds*/ });
    cache.workspaceMiddleware()(reqStub, {}, () => {});
    const instance = Middleware(HullStub, { hostSecret: "secret" });
    this.getStub.restore();
    this.getStub = sinon.stub(HullStub.prototype, "get");
    this.getStub.returns(Promise.resolve());
    instance(reqStub, {}, () => {});
    instance(reqStub, {}, () => {});
    instance(reqStub, {}, () => {
      console.log(this.getStub.callCount);
      expect(this.getStub.calledOnce).to.be.true;
      done();
    });
  });

  it("should call the API only once even for multiple concurrent inits, one call per ship id", function (done) {
    const cache = new Cache({ store: "memory", max: 100, ttl: 1/*seconds*/ });
    cache.workspaceMiddleware()(reqStub, {}, () => {});
    const instance = Middleware(HullStub, { hostSecret: "secret" });
    this.getStub.restore();
    const reqStub2 = _.cloneDeep(reqStub);
    reqStub2.query.ship = "ship_id2";
    this.getStub = sinon.stub(HullStub.prototype, "get");
    this.getStub.returns(Promise.resolve());
    instance(reqStub, {}, () => {});
    instance(reqStub2, {}, () => {});
    instance(reqStub, {}, () => {});
    instance(reqStub2, {}, () => {});
    instance(reqStub, {}, () => {
      expect(this.getStub.calledTwice).to.be.true;
      expect(this.getStub.getCall(0).args[0]).to.equal("ship_id");
      expect(this.getStub.getCall(1).args[0]).to.equal("ship_id2");
      done();
    });
  });
});
