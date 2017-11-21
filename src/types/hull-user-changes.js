/* @flow */

import type { THullAttributesChanges, THullSegmentsChanges } from "./";

/**
 * Object containing all changes related to User in THullUserUpdateMessage
 */
export type THullUserChanges = {
  user: THullAttributesChanges;
  account: THullAttributesChanges;
  segments: THullSegmentsChanges;
};
