/* @flow */

/**
 * Object which is passed to `hullClient.asAccount(ident: THullAccountIdent)``
 */
export type THullAccountIdent = {
  id?: string;
  domain?: string;
  external_id?: string;
};
