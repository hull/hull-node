/* @flow */

import type { THullAttributeName, THullAttributeValue } from "./";

/**
 * Object which is passed to `hullClient.asUser().traits(traits: THullUserAttributes)` call
 */
export type THullUserAttributes = {
  [THullAttributeName]: THullAttributeValue | {
    operation: string;
    value: THullAttributeValue
  };
};
