/* global describe, it */
import { expect } from "chai";

import { setUserSegments } from "../../src/helpers";

import mockSettings from "../support/mock-settings";

function mockReq(segments, filterSegmentIds) {
  const req = mockSettings({ synchronized_segments: filterSegmentIds });
  req.hull.segments = segments.map((id) => {
    return { id };
  });
  return req;
}

describe("setUserSegments", () => {
  it("should remove user from all segments if not matching filter", () => {
    const segmentInfo = {
      add_segment_ids: [],
      remove_segment_ids: []
    };

    const req = mockReq(["a", "b", "c"], ["b"]);

    const user = setUserSegments(req.hull, segmentInfo, { segment_ids: ["a"] });

    expect(user.remove_segment_ids).to.be.eql(["a", "b", "c"]);
  });

  it("should not alter user if he matches the filter", () => {
    const segmentInfo = {
      add_segment_ids: [],
      remove_segment_ids: []
    };

    const req = mockReq(["a", "b", "c"], ["b"]);

    const user = setUserSegments(req.hull, segmentInfo, { segment_ids: ["b"] });

    expect(user.segment_ids).to.be.eql(["b"]);
    expect(user.remove_segment_ids).to.be.eql([]);
  });
});
