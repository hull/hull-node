/* @flow */
/*::
export type {
  THullAccountIdent,
  THullAccountTraits,
  THullAccount,
  THullAttributeName,
  THullAttributeValue,
  THullAttributesChanges,
  THullConnector,
  THullEvent,
  THullObjectIdent,
  THullObjectTraits,
  THullObject,
  THullReqContext,
  THullRequest,
  THullSegment,
  THullSegmentsChanges,
  THullUserChanges,
  THullUserIdent  ,
  THullUserTraits,
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
