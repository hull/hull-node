// @flow

import { HullUserType, HullUserChangesType, HullAccountType, HullEventType, HullSegmentType } from "./";

/**
 * A message sent by the platform where any event, trait or segment change happens
 */
export type UserMessageType = {
  user: HullUserType;
  changes: HullUserChangesType;
  segments: Array<HullSegmentType>;
  events: Array<HullEventType>;
  account: HullAccountType;
}
