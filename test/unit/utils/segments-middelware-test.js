/* global describe, it */
import { expect, should } from "chai";
import sinon from "sinon";
import _ from "lodash";
import Promise from "bluebird";

import { Cache } from "../../../src/infra";
import segmentsMiddleware from "../../../src/utils/segments-middleware";

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

    sinon.stub(req.hull.client, "configuration").returns({ id: "foo", secret: "bar", organization: "localhost"});
    sinon.stub(req2.hull.client, "configuration").returns({ id: "foo2", secret: "bar2", organization: "localhost2" });

    const getStub = sinon.stub(req.hull.client, "get")
      .callsFake(() => {
        return new Promise((resolve, reject) => {
          setTimeout(() => {
            resolve([{ id: "s1", name: "segment 1" }]);
          }, 100);
        });
      });

    const getStub2 = sinon.stub(req2.hull.client, "get")
      .callsFake(() => {
        return new Promise((resolve, reject) => {
          setTimeout(() => {
            resolve([{ id: "s2", name: "segment 2" }]);
          }, 200);
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
        expect(getStub.callCount).to.equal(1);
        expect(getStub2.callCount).to.equal(1);
        expect(req.hull.segments).to.eql([{ id: "s1", name: "segment 1" }]);
        expect(req2.hull.segments).to.eql([{ id: "s2", name: "segment 2" }]);
        done();
      });
    });
  });
});
