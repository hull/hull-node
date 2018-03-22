/* @flow */

import type { THullUserAttributes, THullAccountAttributes } from "./";

/**
 * Object which is passed to `hullClient.asAccount().traits(traits: THullObjectAttributes)` call
 * @public
 * @memberof Types
 */
export type THullObjectAttributes = THullUserAttributes | THullAccountAttributes;
