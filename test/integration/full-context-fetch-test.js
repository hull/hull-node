/* global describe, it */
const { expect, should } = require("chai");
const sinon = require("sinon");
const _ = require("lodash");

const fullContextFetchMiddleware = require("../../src/middlewares/full-context-fetch");
const { Cache } = require("../../src/infra");

const HullStub = require("../unit/support/hull-stub");

let reqStub;

describe("fullContextFetchfullContextFetchMiddleware", () => {
  beforeEach(function beforeEachHandler() {
    this.getStub = sinon.stub(HullStub.prototype, "get");
    this.getStub
      .withArgs("app", sinon.match.any)
      .onCall(0).resolves({
        id: "ship_id",
        private_settings: {
          value: "test"
        }
      })
      .onCall(1).resolves({
        id: "ship_id",
        private_settings: {
          value: "test1"
        }
      })
      .withArgs(
        "/users_segments",
        sinon.match.any,
        sinon.match.any
      ).resolves([])
      .withArgs(
        "/accounts_segments",
        sinon.match.any,
        sinon.match.any
      ).resolves([]);
    this.putStub = sinon.stub(HullStub.prototype, "put");
    this.putStub.onCall(0).resolves("");
    reqStub = {
      hull: {
        client: new HullStub()
      },
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

  it("should take a cache", function (done) {
    const cache = new Cache({ store: "memory", max: 100, ttl: 1/*seconds*/ });
    reqStub.hull.cache = cache.getConnectorCache(reqStub.hull);
    const instance = fullContextFetchMiddleware();
    instance(reqStub, {}, (err) => {
      expect(reqStub.hull.connector.private_settings.value).to.equal("test");
      const newShip = {
        private_settings: {
          value: "test2"
        }
      };
      reqStub.hull.connector = undefined;
      reqStub.hull.cache.set("connector", newShip)
        .then((arg) => {
          instance(reqStub, {}, () => {
            expect(reqStub.hull.connector.private_settings.value).to.equal("test2");
            expect(this.getStub.withArgs("app", sinon.match.any).calledOnce).to.be.true;
            done();
          });
        });
    });
  });

  it("should allow for disabling caching", function (done) {
    const cache = new Cache({ store: "memory", isCacheableValue: () => false });

    reqStub.hull.cache = cache.getConnectorCache(reqStub.hull);
    const instance = fullContextFetchMiddleware();
    instance(reqStub, {}, () => {
      expect(reqStub.hull.connector.private_settings.value).to.equal("test");
      reqStub.hull.connector = undefined;
      instance(reqStub, {}, () => {
        expect(reqStub.hull.connector.private_settings.value).to.equal("test1");
        expect(this.getStub.withArgs("app", sinon.match.any).calledTwice).to.be.true;
        done();
      });
    });
  });

  it("should call the API only once even for multiple concurrent inits", function (done) {
    const cache = new Cache({ store: "memory", max: 100, ttl: 1/*seconds*/ });
    reqStub.hull.cache = cache.getConnectorCache(reqStub.hull);
    const instance = fullContextFetchMiddleware();
    instance(reqStub, {}, () => {});
    instance(reqStub, {}, () => {});
    instance(reqStub, {}, () => {
      expect(this.getStub.withArgs("app", sinon.match.any).calledOnce).to.be.true;
      done();
    });
  });

  it("should call the API only once even for multiple concurrent inits, one call per ship id", function (done) {
    const cache = new Cache({ store: "memory", max: 100, ttl: 1/*seconds*/ });
    reqStub.hull.cache = cache.getConnectorCache(reqStub.hull);
    const instance = fullContextFetchMiddleware();
    const reqStub2 = _.cloneDeep(reqStub);
    reqStub2.hull.client.id = "ship_id2";
    reqStub2.hull.client.secret = "123123";
    instance(reqStub, {}, () => {});
    instance(reqStub2, {}, () => {});
    instance(reqStub, {}, () => {});
    instance(reqStub2, {}, () => {});
    instance(reqStub, {}, () => {
      expect(this.getStub.withArgs("app", sinon.match.any).calledTwice).to.be.true;
      done();
    });
  });

  it("should reuse the internal call when done multiple times", (done) => {
    const req = {
      hull: {
        client: {
          get: () => {},
          configuration: () => {}
        },
        connectorConfig: {}
      }
    };
    const cache = new Cache({ store: "memory", max: 100, ttl: 1 });
    const req2 = _.cloneDeep(req);
    req.hull.cache = cache.getConnectorCache(req.hull);
    req2.hull.cache = cache.getConnectorCache(req2.hull);

    sinon.stub(req.hull.client, "configuration").returns({ id: "foo", secret: "bar", organization: "localhost" });
    sinon.stub(req2.hull.client, "configuration").returns({ id: "foo2", secret: "bar2", organization: "localhost2" });

    const userSegmentsGetStub = sinon.stub(req.hull.client, "get")
      .withArgs("app", sinon.match.any)
      .resolves({
        id: "foo"
      })
      .withArgs("/users_segments", sinon.match.any, sinon.match.any)
      .callsFake(() => {
        return new Promise((resolve, reject) => {
          setTimeout(() => {
            resolve([{ id: "s1", name: "segment 1" }]);
          }, 100);
        });
      });
    const accountSegmentsGetStub = userSegmentsGetStub
      .withArgs("/accounts_segments", sinon.match.any, sinon.match.any)
      .callsFake(() => {
        return new Promise((resolve, reject) => {
          setTimeout(() => {
            resolve([{ id: "as1", name: "account segment 1" }]);
          }, 100);
        });
      });

    const userSegmentsGetStub2 = sinon.stub(req2.hull.client, "get")
      .withArgs("app", sinon.match.any)
      .resolves({
        id: "foo2"
      })
      .withArgs("/users_segments", sinon.match.any, sinon.match.any)
      .callsFake(() => {
        return new Promise((resolve, reject) => {
          setTimeout(() => {
            resolve([{ id: "s2", name: "segment 2" }]);
          }, 100);
        });
      });
    const accountSegmentsGetStub2 = userSegmentsGetStub2
      .withArgs("/accounts_segments", sinon.match.any, sinon.match.any)
      .callsFake(() => {
        return new Promise((resolve, reject) => {
          setTimeout(() => {
            resolve([{ id: "as2", name: "account segment 2" }]);
          }, 100);
        });
      });

    const instance = fullContextFetchMiddleware();

    instance(req, {}, () => {});
    instance(req2, {}, () => {});
    instance(req, {}, () => {});
    instance(req, {}, () => {});
    instance(req2, {}, () => {});
    instance(req, {}, () => {
      instance(req2, {}, () => {
        expect(userSegmentsGetStub.callCount).to.equal(1);
        expect(accountSegmentsGetStub.callCount).to.equal(1);

        expect(req.hull.usersSegments).to.eql([{ id: "s1", name: "segment 1" }]);
        expect(req.hull.accountsSegments).to.eql([{ id: "as1", name: "account segment 1" }]);

        expect(userSegmentsGetStub2.callCount).to.equal(1);
        expect(accountSegmentsGetStub2.callCount).to.equal(1);
        expect(req2.hull.usersSegments).to.eql([{ id: "s2", name: "segment 2" }]);
        expect(req2.hull.accountsSegments).to.eql([{ id: "as2", name: "account segment 2" }]);

        done();
      });
    });
  });
});
