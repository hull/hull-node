/* global describe, it */
import { expect } from "chai";
import sinon from "sinon";
import Promise from "bluebird";

import { updateSettings } from "../../src/helpers";

describe.only("updateSettings", () => {
  it("should call utils.settings.update in the background", (done) => {
    const updateStub = sinon.stub().returns(Promise.resolve({}));
    updateSettings({
      client: {
        utils: {
          settings: { update: updateStub }
        }
      }
    }, {})
    .then((ship) => {
      expect(updateStub.called).to.be.ok;
      done();
    });
  });

  it("should clear cache if possible", (done) => {
    const cacheStub = sinon.stub().returns(Promise.resolve({}));
    updateSettings({
      client: {
        utils: {
          settings: { update: () => Promise.resolve({}) }
        }
      },
      cache: {
        del: cacheStub
      }
    }, {})
    .then((ship) => {
      expect(cacheStub.called).to.be.ok;
      done();
    });
  });
});
