// @flow
import type { $Request, $Application } from "express";
import type {
  HullSegment, HullNotification, HullConnector, HullUserUpdateMessage, HullAccountUpdateMessage, HullClientConfiguration
} from "hull-client";

const HullClient = require("hull-client");
const ShipCache = require("./infra/cache/ship-cache");
const MetricAgent = require("./infra/instrumentation/metric-agent");

/**
 * @module Types
 */

export type HullConnectorOptions = {
  hostSecret: string,
  port: number,
  clientConfig: HullClientConfiguration,
  instrumentation: Object,
  cache: Object,
  queue: Object,
  connectorName: string,
  segmentFilterSetting: any,
  skipSignatureValidation: boolean,
  timeout: number | string
};

export type HullContextBase = {
  requestId: string, // request id
  hostname: string, // req.hostname
  options: Object, // body + query
  connectorConfig: HullConnectorOptions, // configuration passed to Hull.Connector

  cache: ShipCache,
  metric: MetricAgent,
  enqueue: (jobName: string, jobPayload?: Object, options?: Object) => Promise<*>,

  service: Object,
  shipApp: Object, // deprecated

  clientConfig?: Object, // HullClient configuration
  clientConfigToken?: string, // computed token
  config?: Object, // alias to clientConfig
  token?: string, // alias to clientConfigToken
  client?: HullClient,
  helpers?: Object
};

export type HullNotificationFlowControl = {
  type: "next" | "retry",
  size: number,
  in: number,
  in_time: number
};

/**
 * Context added to the express app request by hull-node connector sdk.
 * Accessible via `req.hull` param.
 * @public
 * @memberof Types
 */
export type HullContext = {
  /*:: ...$Exact<HullContextBase>, */
  ship: HullConnector, // since ship name is deprated we move it to connector param
  connector: HullConnector,

  segments: Array<HullSegment>, // legacy alias to user_segments
  users_segments: Array<HullSegment>,
  accounts_segments: Array<HullSegment>,

  notification?: HullNotification,
  smartNotifierResponse?: {
    flow_control: HullNotificationFlowControl
  },
  notificationResponse?: {
    flow_control: HullNotificationFlowControl
  }
};

export type HullRequestBase = {
  ...$Request,
  hull: HullContextBase
};


/*
 * Since Hull Middleware adds new parameter to the Reuqest object from express application
 * we are providing an extended type to allow using HullReqContext
 * @public
 * @memberof Types
 */
export type HullRequest = {
  ...$Request,
  hull: HullContext
};

// TODO: evolve this introducing envelope etc.
export type HullSendResponse = Promise<*>;
export type HullSyncResponse = Promise<*>;

// functional types
export type HullUserUpdateHandlerCallback = (ctx: HullContext, messages: Array<HullUserUpdateMessage>) => HullSendResponse;
export type HullAccountUpdateHandlerCallback = (ctx: HullContext, messages: Array<HullAccountUpdateMessage>) => HullSendResponse;
export type HullConnectorUpdateHandlerCallback = (ctx: HullContext) => HullSyncResponse;
export type HullSegmentUpdateHandlerCallback = (ctx: HullContext) => HullSyncResponse;

// OOP types
export interface HullSyncAgent {
  constructor(ctx: HullContext): void;
  sendUserUpdateMessages(messages: Array<HullUserUpdateMessage>): HullSendResponse;
  sendAccountUpdateMessages(messages: Array<HullAccountUpdateMessage>): HullSendResponse;
  syncConnectorUpdateMessage(): HullSyncResponse;
  syncSegmentUpdateMessage(): HullSyncResponse;
}

export type HullServerFunction = (app: $Application, extra?: Object) => $Application;

export type HullNotificationHandlerCallback =
  HullUserUpdateHandlerCallback |
  HullAccountUpdateHandlerCallback |
  HullConnectorUpdateHandlerCallback |
  HullSegmentUpdateHandlerCallback;

export type HullNotificationChannelName =
  "user:update"
  | "account:update"
  | "ship:update"
  | "connector:update"
  | "segment:update"
  | "segment:delete";

export type HullNotificationHandlerConfiguration = {
  [HullNotificationChannelName]: HullNotificationHandlerCallback | {
    callback: HullNotificationHandlerCallback,
    options: Object
  }
};
