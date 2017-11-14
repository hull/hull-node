/* @flow */

import type { HullSegmentType } from "./";

/**
 * Represents segment changes in UserChangesType
 */
export type HullSegmentsChangesType = {
  entered: Array<HullSegmentType>;
  left: Array<HullSegmentType>;
}
