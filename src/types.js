// @flow
import type { $Request } from "express";
import type { HullUser, HullAccount, HullEvent, HullAttributeName, HullAttributeValue } from "hull-client";

const HullClient = require("hull-client");
const ShipCache = require("./infra/cache/ship-cache");

/**
 * Attributes (traits) changes is an object map where keys are attribute (trait) names and value is an array
 * where first element is an old value and second element is the new value.
 * This object contain information about changes on one or multiple attributes (that's thy attributes and changes are plural).
 * @public
 * @memberof Types
 */
export type HullAttributesChanges = { [HullAttributeName]: [HullAttributeValue, HullAttributeValue] };

/**
 * An object representing the Hull Segment
 * @public
 * @memberof Types
 */
export type HullSegment = {
  id: string;
  name: string;
  stats: {
    users: Number
  };
};

/**
 * Represents segment changes in TUserChanges.
 * The object contains two params which mark which segments user left or entered.
 * It may contain none, one or multiple HullSegment in both params.
 * @public
 * @memberof Types
 */
export type HullSegmentsChanges = {
  entered: Array<HullSegment>;
  left: Array<HullSegment>;
};

/**
 * Object containing all changes related to User in HullUserUpdateMessage
 * @public
 * @memberof Types
 */
export type HullUserChanges = {
  user: HullAttributesChanges;
  account: HullAttributesChanges;
  segments: HullSegmentsChanges;
};

/**
 * A message sent by the platform when any event, attribute (trait) or segment change happens.
 * @public
 * @memberof Types
 */
export type HullUserUpdateMessage = {
  user: HullUser;
  changes: HullUserChanges;
  segments: Array<HullSegment>;
  events: Array<HullEvent>;
  account: HullAccount;
};

export type HullUserUpdateNotification = {
  notification_id: string,
  segments: Array<HullSegment>,
  accounts_segments: Array<HullSegment>,
  messages: Array<HullUserUpdateMessage>
};

/**
 * Connector (also called ship) object with settings, private settings and manifest.json
 * @public
 * @memberof Types
 */
export type HullConnector = {
  id: string;
  updated_at: string;
  created_at: string;
  name: string;
  description: string;
  tags: Array<string>;
  manifest: Object;
  settings: Object;
  private_settings: Object;
  status: Object;
};


/**
 * Context added to the express app request by hull-node connector sdk.
 * Accessible via `req.hull` param.
 * @public
 * @memberof Types
 */
export type HullReqContext = {
  requestId: string;
  config: Object;
  token: string;
  client: HullClient;
  ship: HullConnector; // since ship name is deprated we move it to connector param
  connector: HullConnector;
  hostname: string;
  options: Object;

  connectorConfig: Object;
  segments: Array<HullSegment>;
  users_segments: Array<HullSegment>;
  accounts_segments: Array<HullSegment>;
  cache: ShipCache;
  metric: Object;
  enqueue: Function;
  helpers: Object;
  service: Object;
  shipApp: Object;
  message?: Object;
  notification: HullUserUpdateNotification;
  smartNotifierResponse: ?Object;
};

/*
 * Since Hull Middleware adds new parameter to the Reuqest object from express application
 * we are providing an extended type to allow using HullReqContext
 * @public
 * @memberof Types
 */
export type HullRequest = {
  ...$Request,
  hull: HullReqContext
};
