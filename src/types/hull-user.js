/* @flow */

import type { THullAttributeName, THullAttributeValue } from "./";

/**
 * Main HullUser object with traits
 */
export type THullUser = {
  id: string;
  [THullAttributeName]: THullAttributeValue
}
