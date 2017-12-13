/* @flow */

import type { THullAttributeName, THullAttributeValue } from "./";

/**
 * Object which is passed to `hullClient.asAccount().traits(traits: THullAccountTraits)` call
 */
export type THullAccountTraits = {
  [THullAttributeName]: THullAttributeValue | {
    operation: string;
    value: THullAttributeValue
  };
};
