/* @flow */

/**
 * Object which is passed to `hullClient.asUser(ident: THullUserIdent)``
 */
export type THullUserIdent = {
  id?: string;
  email?: string;
  external_id?: string;
  anonymous_id?: string;
};
