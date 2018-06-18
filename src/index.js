/* @flow */
/*:: export type * from "./types"; */
/*:: export type * from "hull-client"; */

/*:: import type {
  HullAccountAttributes,
  HullAccountClaims,
  HullAccount,
  HullAttributeName,
  HullAttributeValue,
  HullAttributesChanges,
  HullConnector,
  HullEvent,
  HullEntityAttributes,
  HullEntityClaims,
  HullEntity,
  HullSegment,
  HullSegmentsChanges,
  HullUserChanges,
  HullUserAttributes,
  HullUserClaims,
  HullUserUpdateMessage,
  HullUser
} from "hull-client" */

/*:: import type { HullContext, HullRequest } from "./types" */

/*:: export type THullAccountAttributes = HullAccountAttributes; */
/*:: export type THullAccountIdent = HullAccountClaims; */
/*:: export type THullAccount = THullAccount; */
/*:: export type THullAttributeName = HullAttributeName; */
/*:: export type THullAttributeValue = HullAttributeValue; */
/*:: export type THullAttributesChanges = HullAttributesChanges; */
/*:: export type THullConnector = HullConnector; */
/*:: export type THullEvent = HullEvent; */
/*:: export type THullObjectAttributes = HullEntityAttributes; */
/*:: export type THullObjectIdent = HullEntityClaims */
/*:: export type THullObject = HullEntity */
/*:: export type THullReqContext = HullContext; */
/*:: export type THullRequest = HullRequest; */
/*:: export type THullSegment = HullSegment; */
/*:: export type THullSegmentsChanges = HullSegmentsChanges; */
/*:: export type THullUserChanges = HullUserChanges; */
/*:: export type THullUserAttributes = HullUserAttributes; */
/*:: export type THullUserIdent = HullUserClaims; */
/*:: export type THullUserUpdateMessage = HullUserUpdateMessage; */
/*:: export type THullUser = HullUser; */

/**
 * An object that's available in all action handlers and routers as `req.hull`.
 * It's a set of parameters and modules to work in the context of current organization and connector instance.
 *
 * @namespace Context
 * @public
 */

const HullClient = require("hull-client");

const Worker = require("./connector/worker");
const clientMiddleware = require("./middlewares/client");
const HullConnectorClass = require("./connector/hull-connector");
const handlers = require("./handlers");

const boundClientMiddleware = clientMiddleware.bind(undefined, { HullClient });
const boundHullConnector = HullConnectorClass.bind(undefined, { Worker, HullClient });
const boundHandlers = (Object.keys(handlers): Array<string>).reduce((bound: Object, key: string) => {
  bound[key] = handlers[key].bind(undefined, { HullClient });
  return bound;
}, {});

module.exports = {
  Client: HullClient,
  Middleware: boundClientMiddleware,
  Connector: boundHullConnector,
  handlers: boundHandlers
};
