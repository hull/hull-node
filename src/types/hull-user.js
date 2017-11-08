// @flow

import { HullTraitNameType, HullTraitValueType } from "./";

/**
 * Main HullUser object with traits
 */
export type HullUserType = {
  id: string;
  [HullTraitNameType]: HullTraitValueType
}
