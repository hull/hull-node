/* global describe, it */
const { expect } = require("chai");
const sinon = require("sinon");
const Promise = require("bluebird");

const { updateSettings } = require("../../../src/helpers");

describe("updateSettings", () => {
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
