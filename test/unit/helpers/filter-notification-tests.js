/* global describe, it */
/* eslint-disable no-unused-expressions */
const { expect } = require("chai");

const { filterNotification } = require("../../../src/helpers");

const mockSettings = require("../support/mock-settings");

function mockReq(segments, settingsName) {
  const ctx = mockSettings({ synchronized_segments: segments }).hull;
  ctx.connectorConfig = {
    segmentFilterSetting: settingsName
  };
  return ctx;
}

describe("filterNotification", () => {

  it("should allow to setup the filtering setting via context or via direct change", () => {
    expect(filterNotification({
      connectorConfig: {
        segmentFilterSetting: "foo"
      },
      ship: {
        private_settings: {
          foo: ["c"]
        }
      }
    }, { segments: [{ id: "c" }] })).to.be.true;

    expect(filterNotification({
      connectorConfig: {
        segmentFilterSetting: "foo"
      },
      ship: {
        private_settings: {
          foo: ["c"]
        }
      }
    }, { segments: [{ id: "d" }] })).to.be.false;

    expect(filterNotification({
      ship: {
        private_settings: {
          bar: ["c"]
        }
      }
    }, { segments: [{ id: "c" }] }, "bar")).to.be.true;

    expect(filterNotification({
      ship: {
        private_settings: {
          bar: ["c"]
        }
      }
    }, { segments: [{ id: "d" }] }, "bar")).to.be.false;
  });

  it("should reject all users when filter is empty", () => {
    expect(filterNotification(mockReq([]), { segments: [] }, "synchronized_segments"))
      .to.be.false;

    expect(filterNotification(mockReq([], "synchronized_segments"), { segments: [{ id: "a" }, { id: "b" }] }))
      .to.be.false;
  });

  it("should not pass user not matching the filter", () => {
    expect(filterNotification(mockReq(["a"], "synchronized_segments"), { segments: [] }))
      .to.be.false;

    expect(filterNotification(mockReq(["a"], "synchronized_segments"), { segments: [{ id: "b" }] }))
      .to.be.false;

    expect(filterNotification(mockReq(["a", "b"], "synchronized_segments"), { segments: [{ id: "c" }, { id: "d" }] }))
      .to.be.false;
  });

  it("should pass user matching the filter", () => {
    expect(filterNotification(mockReq(["a"], "synchronized_segments"), { segments: [{ id: "a" }] }))
      .to.be.true;

    expect(filterNotification(mockReq(["a", "b"], "synchronized_segments"), { segments: [{ id: "b" }] }))
      .to.be.true;

    expect(filterNotification(mockReq(["a", "b", "c"], "synchronized_segments"), { segments: [{ id: "c" }, { id: "d" }] }))
      .to.be.true;
  });

  it("should pick the pass everybody when the filter setting is not provided", () => {
    expect(filterNotification(mockReq(["a", "b"]), { segments: [{ id: "c" }] }))
      .to.be.true;
  });

  it("should pick the pass everybody when the filter setting is not available", () => {
    expect(filterNotification(mockReq(["a", "b"], "name_of_the_field"), { segments: [{ id: "c" }] }))
      .to.be.true;
  });
});
