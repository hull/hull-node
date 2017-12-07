/* @flow */

import type { THullAttributeName, THullAttributeValue } from "./";

/**
 * Object which is passed to `hullClient.asUser().traits(traits: THullUserTraits)` call
 */
export type THullUserTraits = {
  [THullAttributeName]: THullAttributeValue | {
    operation: string;
    value: THullAttributeValue
  };
};
