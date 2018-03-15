/* @flow */

import type { THullAttributeName, THullAttributeValue } from "./";

/**
 * Attributes (traits) changes is an object map where keys are attribute (trait) names and value is an array
 * where first element is an old value and second element is the new value.
 * This object contain information about changes on one or multiple attributes (that's thy attributes and changes are plural).
 * @public
 * @memberof Types
 */
export type THullAttributesChanges = { [THullAttributeName]: [THullAttributeValue, THullAttributeValue] };
