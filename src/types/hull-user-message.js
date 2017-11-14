/* @flow */

import type { HullUserType, HullUserChangesType, HullAccountType, HullEventType, HullSegmentType } from "./";

/**
 * A message sent by the platform where any event, trait or segment change happens
 */
export type HullUserMessageType = {
  user: HullUserType;
  changes: HullUserChangesType;
  segments: Array<HullSegmentType>;
  events: Array<HullEventType>;
  account: HullAccountType;
}
