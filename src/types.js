// @flow
import type { Middleware, $Request, $Application } from "express";
import type {
  HullSegment,
  HullManifest,
  HullNotification,
  HullConnector,
  HullUserUpdateMessage,
  HullAccountUpdateMessage,
  HullUserDeleteMessage,
  HullAccountDeleteMessage,
  HullSegmentUpdateMessage,
  HullSegmentDeleteMessage,
  HullConnectorUpdateMessage,
  HullClientConfiguration,
  HullNotificationHandlerOptions,
  HullSchedulerHandlerOptions,
  HullExternalHandlerOptions
} from "hull-client";

export type * from "hull-client";

const Client = require("hull-client");

const ConnectorCache = require("./infra/cache/connector-cache");
const MetricAgent = require("./infra/instrumentation/metric-agent");
const InstrumentationAgent = require("./infra/instrumentation/instrumentation-agent");
const Cache = require("./infra/cache/cache-agent");
const Queue = require("./infra/queue/queue-agent");
// IMPORTANT: FOR SPREAD SYNTAX:
// https://github.com/facebook/flow/issues/3534#issuecomment-287580240

/**
 * @module Types
 */

export type HullClient = Client;

export type JsonConfig = {
  inflate?: boolean,
  limit?: string,
  reviver?: Function,
  strict?: boolean,
  type?: string | Function,
  verify?: Function
};

export type HullConnectorConfig = {
  hostSecret: ?string,
  port: number | string,
  json?: JsonConfig,
  clientConfig: HullClientConfiguration,
  instrumentation?: InstrumentationAgent,
  cache?: Cache,
  queue?: Queue,
  connectorName?: string,
  segmentFilterSetting?: any,
  skipSignatureValidation?: boolean,
  notificationValidatorHttpClient?: Object,
  timeout?: number | string
};

export type HullClientCredentials = {
  id: $PropertyType<HullClientConfiguration, "id">,
  secret: $PropertyType<HullClientConfiguration, "secret">,
  organization: $PropertyType<HullClientConfiguration, "organization">
};

export type HullContextBase = {
  requestId?: string, // request id
  hostname: string, // req.hostname
  options: Object, // req.query
  isBatch: boolean,
  HullClient: Class<Client>,

  connectorConfig: HullConnectorConfig, // configuration passed to Hull.Connector
  clientConfig: HullClientConfiguration, // configuration which will be applied to Hull Client

  cache: ConnectorCache,
  metric: MetricAgent,
  enqueue: (
    jobName: string,
    jobPayload?: Object,
    options?: Object
  ) => Promise<*>,

  token?: string,
  clientCredentials?: HullClientCredentials, // HullClient credentials
  clientCredentialsToken?: string // encrypted token with HullClient credentials
};

export type HullContextWithCredentials = {
  ...$Exact<HullContextBase>,
  clientCredentials: HullClientCredentials, // HullClient configuration
  clientCredentialsToken?: string,

  connector?: HullConnector,
  usersSegments?: Array<HullSegment>,
  accountsSegments?: Array<HullSegment>
};

export type HullContextWithClient = {
  ...$Exact<HullContextWithCredentials>,
  clientCredentialsToken: string,
  client: Client,
  notification?: HullNotification
};

export type HullNotificationFlowControl = {
  type: "next" | "retry",
  size: number,
  in: number,
  in_time: number
};

export type HullMessageResponse = {|
  message_id?: string,
  action: "success" | "skip" | "error",
  type: "user" | "account" | "event",
  message?: string,
  id: ?string,
  data: {}
|};

export type HullNotificationResponse = Promise<{
  flow_control: HullNotificationFlowControl,
  responses: Array<?HullMessageResponse>
}>;

export type HullExternalResponse = Promise<any>;

/**
 * Context added to the express app request by hull-node connector sdk.
 * Accessible via `req.hull` param.
 * @public
 * @memberof Types
 */
export type HullContextFull = {
  ...$Exact<HullContextWithClient>,
  connector: HullConnector,
  usersSegments: Array<HullSegment>,
  accountsSegments: Array<HullSegment>,

  notification?: HullNotification,
  handlerName?: string
};

export type HullContext<Connector: HullConnector> = {
  ...$Exact<HullContextFull>,
  connector: Connector
};

export type HullRequestBase = {
  ...$Request,
  headers: {
    [string]: string
  },
  hostSecret: string,
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
declare class HullExpressRequest extends express$Request {
  hull: HullContextFull
};

export type HullRequestFull = HullExpressRequest;

export type HullRequest<Context> = {
  ...HullExpressRequest,
  hull: Context
};

// TODO: evolve this introducing envelope etc.
export type HullSendResponse = Promise<*>;
export type HullSyncResponse = Promise<*>;

// OOP types
export interface HullSyncAgent {
  constructor(ctx: HullContextFull): void;
  sendUserUpdateMessages(
    messages: Array<HullUserUpdateMessage>
  ): HullSendResponse;
  sendAccountUpdateMessages(
    messages: Array<HullAccountUpdateMessage>
  ): HullSendResponse;
  syncConnectorUpdateMessage(): HullSyncResponse;
  syncSegmentUpdateMessage(): HullSyncResponse;
}
export type HullServerFunction = (
  app: $Application,
  extra?: Object
) => $Application;

// functional types

type HandlerMap = {
  [string]: any
};

/* Preformatted message generated from an incoming request */
export type HullExternalHandlerMessage = {
  ip: string,
  url: string,
  method: string,
  protocol: string,
  hostname: string,
  path: string,
  params: HandlerMap | Array<string>,
  query: HandlerMap,
  headers: HandlerMap,
  cookies: HandlerMap,
  body?: any,
}
export type HullExternalHandlerCallback = (ctx: HullContextFull, messages: Array<HullExternalHandlerMessage>) => HullExternalResponse;

/* User Handlers */
export type HullUserUpdateHandlerCallback = (
  ctx: HullContextFull,
  messages: Array<HullUserUpdateMessage>
) => HullNotificationResponse;
export type HullUserDeleteHandlerCallback = (
  ctx: HullContextFull,
  messages: Array<HullUserDeleteMessage>
) => HullNotificationResponse;

/* Account Handlers */
export type HullAccountUpdateHandlerCallback = (
  ctx: HullContextFull,
  messages: Array<HullAccountUpdateMessage>
) => HullNotificationResponse;
export type HullAccountDeleteHandlerCallback = (
  ctx: HullContextFull,
  messages: Array<HullAccountDeleteMessage>
) => HullNotificationResponse;

/* Segment Handlers */
export type HullSegmentUpdateHandlerCallback = (
  ctx: HullContextFull,
  messages: Array<HullSegmentUpdateMessage>
) => HullNotificationResponse;
export type HullSegmentDeleteHandlerCallback = (
  ctx: HullContextFull,
  messages: Array<HullSegmentDeleteMessage>
) => HullNotificationResponse;

/* TODO: Evolve contract so that these input and return values are correct */
export type HullConnectorUpdateHandlerCallback = (
  ctx: HullContextFull,
  messages: Array<HullConnectorUpdateMessage>
) => HullNotificationResponse;

export type HullNotificationHandlerCallback =
  HullConnectorUpdateHandlerCallback
  | HullUserUpdateHandlerCallback
  | HullUserDeleteHandlerCallback

  | HullAccountUpdateHandlerCallback
  | HullAccountDeleteHandlerCallback

  | HullSegmentUpdateHandlerCallback
  | HullSegmentDeleteHandlerCallback;

export type HullNotificationHandlerConfigurationEntry = {
  callback: HullNotificationHandlerCallback,
  options?: HullNotificationHandlerOptions
};
export type HullNotificationHandlerConfiguration = {
  [HullChannelName: string]: HullNotificationHandlerConfigurationEntry
};

/* Batch Handlers */
export type HullBatchHandlerConfigurationEntry = {
  callback: HullNotificationHandlerCallback,
  options?: HullNotificationHandlerOptions
};
export type HullBatchHandlersConfiguration = {
  [HullChannelName: string]: HullBatchHandlerConfigurationEntry
};

/* External handlers */
export type HullStatusHandlerCallback = HullExternalHandlerCallback;

export type HullHandlers = {
  [handlerName: string]: HullExternalHandlerCallback | HullNotificationHandlerCallback
};

export type HullExternalHandlerConfigurationEntry = {
  callback: HullExternalHandlerCallback,
  options?: HullExternalHandlerOptions
};

/* schedulerHandler */
export type HullSchedulerHandlerConfigurationEntry = {
  callback: HullExternalHandlerCallback,
  options?: HullSchedulerHandlerOptions
};

export type HullServerConfig = {
  devMode: boolean,
  middlewares: Array<Middleware>,
  manifest: HullManifest,
  handlers: HullHandlers,
  connectorConfig: HullConnectorConfig
};
