// @flow
import type { $Request, $Application } from "express";
import type {
  HullSegment, HullNotification, HullConnector, HullUserUpdateMessage, HullAccountUpdateMessage, HullClientConfiguration
} from "hull-client";

const HullClient = require("hull-client");
const ConnectorCache = require("./infra/cache/connector-cache");
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

export type HullNotificationFlowControl = {
  type: "next" | "retry",
  size: number,
  in: number,
  in_time: number
};

export type HullClientCredentials = {
  id: $PropertyType<HullClientConfiguration, "id">,
  secret: $PropertyType<HullClientConfiguration, "secret">,
  organization: $PropertyType<HullClientConfiguration, "organization">,
};

export type HullContextBase = {
  requestId?: string, // request id
  hostname: string, // req.hostname
  options: Object, // body + query
  connectorConfig: HullConnectorOptions, // configuration passed to Hull.Connector
  clientConfig: HullClientConfiguration,
  cache: ConnectorCache,
  metric: MetricAgent,
  enqueue: (jobName: string, jobPayload?: Object, options?: Object) => Promise<*>,

  service: Object,

  clientCredentials?: HullClientCredentials, // HullClient configuration
  clientCredentialsToken?: string, // computed token
};

export type HullContextWithCredentials = {
  /*:: ...$Exact<HullContextBase>, */
  clientCredentials: HullClientCredentials, // HullClient configuration
  clientCredentialsToken?: string, // computed token

  connector?: HullConnector,
  usersSegments?: Array<HullSegment>,
  accountsSegments?: Array<HullSegment>
};

export type HullContextWithClient = {
  /*:: ...$Exact<HullContextWithCredentials>, */
  client: HullClient,
  helpers: Object
};

/**
 * Context added to the express app request by hull-node connector sdk.
 * Accessible via `req.hull` param.
 * @public
 * @memberof Types
 */
export type HullContextFull = {
  /*:: ...$Exact<HullContextWithClient>, */
  connector: HullConnector,
  usersSegments: Array<HullSegment>,
  accountsSegments: Array<HullSegment>,

  notification?: HullNotification,
  notificationResponse?: {
    flow_control: HullNotificationFlowControl
  }
};

export type HullRequestBase = {
  ...$Request,
  headers: {
    [string]: string
  },
  hull: HullContextBase
};

export type HullRequestWithCredentials = {
  ...$Request,
  headers: {
    [string]: string
  },
  hull: HullContextWithCredentials
};

export type HullRequestWithClient = {
  ...$Request,
  headers: {
    [string]: string
  },
  hull: HullContextWithClient
};


/*
 * Since Hull Middleware adds new parameter to the Reuqest object from express application
 * we are providing an extended type to allow using HullReqContext
 * @public
 * @memberof Types
 */
export type HullRequestFull = {
  ...$Request,
  hull: HullContextFull
};

// TODO: evolve this introducing envelope etc.
export type HullSendResponse = Promise<*>;
export type HullSyncResponse = Promise<*>;

// functional types
export type HullUserUpdateHandlerCallback = (ctx: HullContextFull, messages: Array<HullUserUpdateMessage>) => HullSendResponse;
export type HullAccountUpdateHandlerCallback = (ctx: HullContextFull, messages: Array<HullAccountUpdateMessage>) => HullSendResponse;
export type HullConnectorUpdateHandlerCallback = (ctx: HullContextFull) => HullSyncResponse;
export type HullSegmentUpdateHandlerCallback = (ctx: HullContextFull) => HullSyncResponse;

// OOP types
export interface HullSyncAgent {
  constructor(ctx: HullContextFull): void;
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

export type HullNotificationHandlerConfiguration = {
  [HullNotificationChannelName: string]: HullNotificationHandlerCallback | {
    callback: HullNotificationHandlerCallback,
    options: Object
  }
};
