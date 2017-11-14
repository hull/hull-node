/* @flow */

import type { THullAttributeName, THullAttributeValue } from "./";

/**
 * Account object with id and traits
 */
export type THullAccount = {
  id: string;
  [THullAttributeName]: THullAttributeValue;
}
