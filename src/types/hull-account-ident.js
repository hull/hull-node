/* @flow */

/**
 * Object which is passed to `hullClient.asAccount(ident: THullAccountIdent)``
 * @public
 * @memberof Types
 */
export type THullAccountIdent = {
  id?: string;
  domain?: string;
  external_id?: string;
};
