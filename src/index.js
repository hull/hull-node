/* @flow */
/*::
export type {
  THullAccountAttributes,
  THullAccountIdent,
  THullAccount,
  THullAttributeName,
  THullAttributeValue,
  THullAttributesChanges,
  THullConnector,
  THullEvent,
  THullObjectAttributes,
  THullObjectIdent,
  THullObject,
  THullReqContext,
  THullRequest,
  THullSegment,
  THullSegmentsChanges,
  THullUserChanges,
  THullUserAttributes,
  THullUserIdent,
  THullUserUpdateMessage,
  THullUser
} from "./types";
*/

/**
 * An object that's available in all action handlers and routers as `req.hull`.
 * It's a set of parameters and modules to work in the context of current organization and connector instance.
 *
 * @namespace Context
 * @public
 */

const Client = require("hull-client");

const clientMiddleware = require("./middleware/client");
const HullConnector = require("./connector/hull-connector");

Client.Client = Client;
Client.Middleware = clientMiddleware.bind(undefined, Client);
Client.Connector = HullConnector.bind(undefined, Client);

module.exports = Client;
