/* @flow */

import type { HullTraitNameType, HullTraitValueType } from "./";

/**
 * Account object with id and traits
 */
export type HullAccountType = {
  id: string;
  [HullTraitNameType]: HullTraitValueType;
}
