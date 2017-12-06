/* @flow */
/*::
export type {
  THullAccount,
  THullConnector,
  THullEvent,
  THullObject,
  THullReqContext,
  THullSegment,
  THullSegmentsChanges,
  THullAttributeName,
  THullAttributeValue,
  THullAttributesChanges,
  THullUserChanges,
  THullUserIdent  ,
  THullUserTraits,
  THullUserUpdateMessage,
  THullUser,
  THullRequest
} from "./types";
*/

const Client = require("hull-client");

const clientMiddleware = require("./middleware/client");
const HullConnector = require("./connector/hull-connector");

Client.Middleware = clientMiddleware.bind(undefined, Client);
Client.Connector = HullConnector.bind(undefined, Client);

module.exports = Client;
