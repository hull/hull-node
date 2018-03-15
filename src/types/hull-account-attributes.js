/* @flow */

import type { THullAttributeName, THullAttributeValue } from "./";

/**
 * Object which is passed to `hullClient.asAccount().traits(traits: THullAccountTraits)` call
 * @public
 * @memberof Types
 */
export type THullAccountAttributes = {
  [THullAttributeName]: THullAttributeValue | {
    operation: string;
    value: THullAttributeValue
  };
};
