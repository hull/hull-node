/* @flow */

import type { THullUser, THullUserChanges, THullAccount, THullEvent, THullSegment } from "./";

/**
 * A message sent by the platform when any event, attribute (trait) or segment change happens.
 * @public
 * @memberof Types
 */
export type THullUserUpdateMessage = {
  user: THullUser;
  changes: THullUserChanges;
  segments: Array<THullSegment>;
  events: Array<THullEvent>;
  account: THullAccount;
};
