/* global describe, it */
const { expect, should } = require("chai");
const sinon = require("sinon");
const _ = require("lodash");
const Promise = require("bluebird");

const { Cache } = require("../../src/infra");
const segmentsMiddleware = require("../../src/utils/segments-middleware");

describe("segmentMiddleware", () => {
  it("should reuse the internal call when done multiple times", (done) => {
    const req = {
      hull: {
        client: {
          get: () => {},
          configuration: () => {}
        },
        ship: {
          id: "123"
        },
        connectorConfig: {}
      }
    };
    const cache = new Cache({ store: "memory", max: 100, ttl: 1 });
    const req2 = _.cloneDeep(req);
    cache.contextMiddleware()(req, {}, () => {});
    cache.contextMiddleware()(req2, {}, () => {});

    sinon.stub(req.hull.client, "configuration").returns({ id: "foo", secret: "bar", organization: "localhost" });
    sinon.stub(req2.hull.client, "configuration").returns({ id: "foo2", secret: "bar2", organization: "localhost2" });

    const userSegmentsGetStub = sinon.stub(req.hull.client, "get")
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

    const instance = segmentsMiddleware();

    instance(req, {}, () => {});
    instance(req2, {}, () => {});
    instance(req, {}, () => {});
    instance(req, {}, () => {});
    instance(req2, {}, () => {});
    instance(req, {}, () => {
      instance(req2, {}, () => {
        expect(userSegmentsGetStub.callCount).to.equal(1);
        expect(accountSegmentsGetStub.callCount).to.equal(1);

        expect(req.hull.segments).to.eql([{ id: "s1", name: "segment 1" }]);
        expect(req.hull.users_segments).to.eql([{ id: "s1", name: "segment 1" }]);
        expect(req.hull.accounts_segments).to.eql([{ id: "as1", name: "account segment 1" }]);

        expect(userSegmentsGetStub2.callCount).to.equal(1);
        expect(accountSegmentsGetStub2.callCount).to.equal(1);
        expect(req2.hull.segments).to.eql([{ id: "s2", name: "segment 2" }]);
        expect(req2.hull.users_segments).to.eql([{ id: "s2", name: "segment 2" }]);
        expect(req2.hull.accounts_segments).to.eql([{ id: "as2", name: "account segment 2" }]);

        done();
      });
    });
  });
});
