/* @flow */

import type { THullAttributeName, THullAttributeValue } from "./";

/**
 * Main HullUser object with attributes (traits)
 */
export type THullUser = {
  id: string;
  [THullAttributeName]: THullAttributeValue;
  account: {
    [THullAttributeName]: THullAttributeValue;
  };
};
