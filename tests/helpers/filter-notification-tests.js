/* global describe, it */
/* eslint-disable no-unused-expressions */
import { expect } from "chai";

import { filterNotification } from "../../src/helpers";

import mockSettings from "../support/mock-settings";

function mockReq(segments) {
  return mockSettings({ synchronized_segments: segments }).hull;
}

describe("filterNotification", () => {
  it("should reject all users when filter is empty", () => {
    expect(filterNotification(mockReq([]), { segments: [] }))
      .to.be.false;

    expect(filterNotification(mockReq([]), { segments: [{ id: "a" }, { id: "b" }] }))
      .to.be.false;
  });

  it("should not pass user not matching the filter", () => {
    expect(filterNotification(mockReq(["a"]), { segments: [] }))
      .to.be.false;

    expect(filterNotification(mockReq(["a"]), { segments: [{ id: "b" }] }))
      .to.be.false;

    expect(filterNotification(mockReq(["a", "b"]), { segments: [{ id: "c" }, { id: "d" }] }))
      .to.be.false;
  });

  it("should pass user matching the filter", () => {
    expect(filterNotification(mockReq(["a"]), { segments: [{ id: "a" }] }))
      .to.be.true;

    expect(filterNotification(mockReq(["a", "b"]), { segments: [{ id: "b" }] }))
      .to.be.true;

    expect(filterNotification(mockReq(["a", "b", "c"]), { segments: [{ id: "c" }, { id: "d" }] }))
      .to.be.true;
  });

  it("should pass user which just left the filtered segment", () => {
    expect(filterNotification(mockReq(["a", "b"]), { segments: [{ id: "c" }], changes: { segments: { left: [{ id: "b" }]} } }))
      .to.be.true;

    expect(filterNotification(mockReq(["a", "b"]), { segments: [{ id: "c" }], changes: { segments: { left: [{ id: "d" }]} } }))
      .to.be.false;
  });
});
