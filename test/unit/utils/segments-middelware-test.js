/* global describe, it */
import { expect, should } from "chai";
import sinon from "sinon";
import _ from "lodash";
import Promise from "bluebird";

import segmentsMiddleware from "../../src/utils/segments-middleware";

describe("segmentMiddleware", () => {
  it("should reuse the internal call when done multiple times", (done) => {
    const req = {
      hull: {
        cache: {
          wrap: () => {}
        },
        client: {
          get: () => {}
        },
        ship: {
          id: "123"
        },
        connectorConfig: {}
      }
    };
    const req2 = _.cloneDeep(req);
    req2.hull.ship.id = "345";

    const wrapStub = sinon.stub(req.hull.cache, "wrap")
      .callsFake(() => {
        return new Promise((resolve, reject) => {
          setTimeout(() => {
            resolve([{ id: "s1", name: "segment 1" }]);
          }, 100);
        });
      });

    const wrapStub2 = sinon.stub(req2.hull.cache, "wrap")
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
        expect(wrapStub.callCount).to.equal(1);
        expect(wrapStub2.callCount).to.equal(1);
        expect(req.hull.segments).to.eql([{ id: "s1", name: "segment 1" }]);
        expect(req2.hull.segments).to.eql([{ id: "s2", name: "segment 2" }]);
        done();
      });
    });
  });
});
