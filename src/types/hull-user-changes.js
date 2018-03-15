/* @flow */

import type { THullAttributesChanges, THullSegmentsChanges } from "./";

/**
 * Object containing all changes related to User in THullUserUpdateMessage
 * @public
 * @memberof Types
 */
export type THullUserChanges = {
  user: THullAttributesChanges;
  account: THullAttributesChanges;
  segments: THullSegmentsChanges;
};
