/* @flow */

import type { THullUser, THullUserChanges, THullAccount, THullEvent, THullSegment } from "./";

/**
 * A message sent by the platform where any event, trait or segment change happens
 */
export type THullUserUpdateMessage = {
  user: THullUser;
  changes: THullUserChanges;
  segments: Array<THullSegment>;
  events: Array<THullEvent>;
  account: THullAccount;
}
