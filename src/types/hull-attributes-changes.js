/* @flow */

import type { THullAttributeName, THullAttributeValue } from "./";

/**
 * Trait changes is an object map where keys are trait names and value is an array
 * where first element is an old value and second element is new value.
 */
export type THullAttributesChanges = { [THullAttributeName]: [THullAttributeValue, THullAttributeValue] };
