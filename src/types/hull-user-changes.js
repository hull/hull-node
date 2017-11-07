// @flow

import { HullTraitsChangesType, HullSegmentsChangesType } from "./";

/**
 * Object containing all changes in HullUserMessage
 */
export type HullUserChangesType = {
  user: HullTraitsChangesType;
  account: HullTraitsChangesType;
  segments: HullSegmentsChangesType;
}
