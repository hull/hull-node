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

const Client = require("hull-client");

const clientMiddleware = require("./middleware/client");
const HullConnector = require("./connector/hull-connector");

Client.Middleware = clientMiddleware.bind(undefined, Client);
Client.Connector = HullConnector.bind(undefined, Client);

module.exports = Client;
