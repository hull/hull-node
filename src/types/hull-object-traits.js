/* @flow */

import type { THullUserTraits, THullAccountTraits } from "./";

/**
 * Object which is passed to `hullClient.asAccount().traits(traits: THullObjectTraits)` call
 */
export type THullObjectTraits = THullUserTraits | THullAccountTraits;
