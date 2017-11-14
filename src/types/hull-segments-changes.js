/* @flow */

import type { THullSegment } from "./";

/**
 * Represents segment changes in UserChangesType
 */
export type THullSegmentsChanges = {
  entered: Array<THullSegment>;
  left: Array<THullSegment>;
}
