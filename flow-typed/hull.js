declare module 'hull' {

  declare type HullTraitNameType = string;

  declare type HullTraitValueType = string | boolean | Date | Array<string>;

  declare type HullAccountType = {
    id: string;
    [HullTraitNameType]: HullTraitValueType;
  };

  declare type HullUserType = {
    id: string;
    [HullTraitNameType]: HullTraitValueType
  };

  declare type HullConnectorType = {
    id: string;
    name: string;
    manifest: Object;
    settings: Object;
    private_settings: Object;
    status: Object;
  };

  declare type HullEventType = {
    id: string;
    event: string;
    context: Object;
    properties: Object;
  };

  declare type HullSegmentType = {
    id: string;
    name: string;
  };

  declare type HullObjectType = HullUserType | HullAccountType;

  declare type HullSegmentsChangesType = {
    entered: Array<HullSegmentType>;
    left: Array<HullSegmentType>;
  };

  declare type HullTraitsChangesType = { [HullTraitNameType]: [HullTraitValueType, HullTraitValueType] };

  declare type HullUserChangesType = {
    user: HullTraitsChangesType;
    account: HullTraitsChangesType;
    segments: HullSegmentsChangesType;
  };

  declare type HullUserMessageType = {
    user: HullUserType;
    changes: HullUserChangesType;
    segments: Array<HullSegmentType>;
    events: Array<HullEventType>;
    account: HullAccountType;
  };

  declare type HullReqContextType = {
    config: Object;
    token: String;
    client: Object;

    service: Object;

    segments: Array<HullSegmentType>;
    ship: HullConnectorType;
    connector: HullConnectorType;

    hostname: String;
    options: Object;
    connectorConfig: Object;

    metric: Object;
    helpers: Object;
    notification: Object;

    smartNotifierResponse: Object;
  };
};
