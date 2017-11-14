/* @flow */

import type { THullAttributesChanges, THullSegmentsChanges } from "./";

/**
 * Object containing all changes in HullUserMessage
 */
export type THullUserChanges = {
  user: THullAttributesChanges;
  account: THullAttributesChanges;
  segments: THullSegmentsChanges;
}
