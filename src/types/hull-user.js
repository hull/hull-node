/* @flow */

import type { THullAttributeName, THullAttributeValue } from ".";

/**
 * Main HullUser object with attributes (traits)
 * @public
 * @memberof Types
 */
export type THullUser = {
  id: string;
  anonymous_id: Array<string>;
  email: string;
  [THullAttributeName]: THullAttributeValue;
  account: {
    [THullAttributeName]: THullAttributeValue;
  };
};
