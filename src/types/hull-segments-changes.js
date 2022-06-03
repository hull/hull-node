/* @flow */

import type { THullSegment } from ".";

/**
 * Represents segment changes in TUserChanges.
 * The object contains two params which mark which segments user left or entered.
 * It may contain none, one or multiple THullSegment in both params.
 * @public
 * @memberof Types
 */
export type THullSegmentsChanges = {
  entered: Array<THullSegment>;
  left: Array<THullSegment>;
};
