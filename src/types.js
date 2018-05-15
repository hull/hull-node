// @flow
import type { $Request } from "express";
import type {
  HullSegment, HullNotification, HullConnector
} from "hull-client";

const HullClient = require("hull-client");
const ShipCache = require("./infra/cache/ship-cache");
const MetricAgent = require("./infra/instrumentation/metric-agent");
const enqueue = require("./infra/queue/enqueue");
const { SmartNotifierResponse } = require("./utils/smart-notifier-response");

/**
 * @module Types
 */

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
  metric: MetricAgent;
  enqueue: typeof enqueue;
  helpers: Object;
  service: Object;
  shipApp: Object;
  message?: Object;
  notification?: HullNotification;
  smartNotifierResponse: ?SmartNotifierResponse;
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
