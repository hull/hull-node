/* @flow */

import type { THullAttributeName, THullAttributeValue } from "./";

/**
 * Account object with ident information and traits
 * @public
 * @memberof Types
 */
export type THullAccount = {
  id: string;
  [THullAttributeName]: THullAttributeValue;
};
