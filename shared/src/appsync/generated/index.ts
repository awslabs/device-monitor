/* This is auto generated code. Use `graphql-codegen-esm` to update. */
/* eslint-disable @typescript-eslint/typedef */
import type { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = {
  [K in keyof T]: T[K];
};
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & {
  [SubKey in K]?: Maybe<T[SubKey]>;
};
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & {
  [SubKey in K]: Maybe<T[SubKey]>;
};
export type MakeEmpty<
  T extends { [key: string]: unknown },
  K extends keyof T
> = { [_ in K]?: never };
export type Incremental<T> =
  | T
  | {
      [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never;
    };
/** All built-in and custom scalars, mapped to their actual values */
export interface Scalars {
  ID: { input: string; output: string };
  String: { input: string; output: string };
  Boolean: { input: boolean; output: boolean };
  Int: { input: number; output: number };
  Float: { input: number; output: number };
  AWSDate: { input: string; output: string };
  AWSDateTime: { input: string; output: string };
  AWSEmail: { input: string; output: string };
  AWSIPAddress: { input: string; output: string };
  AWSJSON: { input: unknown; output: string };
  AWSPhone: { input: string; output: string };
  AWSTime: { input: string; output: string };
  AWSTimestamp: { input: number; output: number };
  AWSURL: { input: string; output: string };
  BigInt: { input: number; output: number };
  Double: { input: number; output: number };
}

export enum CloudwatchMetricType {
  ConnectedDevices = 'CONNECTED_DEVICES',
  DisconnectRate = 'DISCONNECT_RATE'
}

export interface ContentDisplay {
  id: Maybe<Scalars['String']['output']>;
  visible: Maybe<Scalars['Boolean']['output']>;
  width: Maybe<Scalars['Float']['output']>;
}

export interface ContentDisplayInput {
  id: InputMaybe<Scalars['String']['input']>;
  visible: InputMaybe<Scalars['Boolean']['input']>;
  width: InputMaybe<Scalars['Float']['input']>;
}

export enum DefenderMetricType {
  AuthorizationFailures = 'AUTHORIZATION_FAILURES',
  ConnectionAttempts = 'CONNECTION_ATTEMPTS',
  Disconnects = 'DISCONNECTS',
  DisconnectDuration = 'DISCONNECT_DURATION'
}

export interface Device {
  attributes: Scalars['AWSJSON']['output'];
  connected: Scalars['Boolean']['output'];
  deviceGroups: Array<Scalars['String']['output']>;
  deviceType: Scalars['String']['output'];
  disconnectReason: Maybe<Scalars['String']['output']>;
  firmwareType: Maybe<Scalars['String']['output']>;
  firmwareVersion: Maybe<Scalars['String']['output']>;
  lastConnectedAt: Maybe<Scalars['AWSTimestamp']['output']>;
  thingName: Scalars['String']['output'];
}

export interface DeviceListPreferences {
  contentDensity: Maybe<Scalars['String']['output']>;
  contentDisplay: Maybe<Array<ContentDisplay>>;
  favoriteDevices: Maybe<Array<Scalars['String']['output']>>;
  filterObjects: Maybe<Array<FilterPreference>>;
  pageSize: Maybe<Scalars['Int']['output']>;
  stickyColumns: Maybe<StickyColumns>;
  stripedRows: Maybe<Scalars['Boolean']['output']>;
  visibleContent: Maybe<Array<Scalars['String']['output']>>;
  wrapLines: Maybe<Scalars['Boolean']['output']>;
}

export interface DeviceListPreferencesInput {
  columnWidths: InputMaybe<Array<Scalars['Float']['input']>>;
  contentDensity: InputMaybe<Scalars['String']['input']>;
  contentDisplay: InputMaybe<Array<ContentDisplayInput>>;
  favoriteDevices: InputMaybe<Array<Scalars['String']['input']>>;
  filterObjects: InputMaybe<Array<FilterPreferenceInput>>;
  pageSize: InputMaybe<Scalars['Int']['input']>;
  stickyColumns: InputMaybe<StickyColumnsInput>;
  stripedRows: InputMaybe<Scalars['Boolean']['input']>;
  visibleContent: InputMaybe<Array<Scalars['String']['input']>>;
  wrapLines: InputMaybe<Scalars['Boolean']['input']>;
}

export interface DeviceStats {
  brandNameDistribution: Maybe<Scalars['AWSJSON']['output']>;
  connectedDevices: Scalars['Int']['output'];
  countryDistribution: Scalars['AWSJSON']['output'];
  deviceTypeDistribution: Scalars['AWSJSON']['output'];
  disconnectDistribution: Scalars['AWSJSON']['output'];
  disconnectedDevices: Scalars['Int']['output'];
  groupDistribution: Scalars['AWSJSON']['output'];
  productTypeDistribution: Scalars['AWSJSON']['output'];
  recordTime: Scalars['String']['output'];
  registeredDevices: Scalars['Int']['output'];
  status: Scalars['String']['output'];
  ttl: Maybe<Scalars['AWSTimestamp']['output']>;
  versionDistribution: Scalars['AWSJSON']['output'];
}

export interface DeviceStatsInput {
  brandNameDistribution: Scalars['AWSJSON']['input'];
  connectedDevices: Scalars['Int']['input'];
  countryDistribution: Scalars['AWSJSON']['input'];
  deviceTypeDistribution: Scalars['AWSJSON']['input'];
  disconnectDistribution: Scalars['AWSJSON']['input'];
  disconnectedDevices: Scalars['Int']['input'];
  groupDistribution: Scalars['AWSJSON']['input'];
  productTypeDistribution: Scalars['AWSJSON']['input'];
  recordTime: Scalars['String']['input'];
  registeredDevices: Scalars['Int']['input'];
  status: Scalars['String']['input'];
  ttl: InputMaybe<Scalars['AWSTimestamp']['input']>;
  versionDistribution: Scalars['AWSJSON']['input'];
}

export interface Filter {
  fieldName: Scalars['String']['output'];
  operator: FilterOperator | `${FilterOperator}`;
  value: Scalars['String']['output'];
}

export interface FilterInput {
  fieldName: Scalars['String']['input'];
  operator: FilterOperator | `${FilterOperator}`;
  value: Scalars['String']['input'];
}

export enum FilterOperation {
  And = 'and',
  Or = 'or'
}

export enum FilterOperator {
  Between = 'between',
  Contains = 'contains',
  Eq = 'eq',
  Ge = 'ge',
  Gt = 'gt',
  Le = 'le',
  Lt = 'lt',
  Ne = 'ne',
  None = 'none'
}

export interface FilterPreference {
  filters: Maybe<Array<Filter>>;
  name: Scalars['String']['output'];
  operation: FilterOperation | `${FilterOperation}`;
}

export interface FilterPreferenceInput {
  filters: InputMaybe<Array<FilterInput>>;
  name: Scalars['String']['input'];
  operation: FilterOperation | `${FilterOperation}`;
}

export interface FilterResolverInput {
  favoriteDevices: InputMaybe<Array<Scalars['String']['input']>>;
  filters: InputMaybe<Array<FilterInput>>;
  operation: FilterOperation | `${FilterOperation}`;
}

export interface JobDetails {
  abortThresholdPercentage: Maybe<Scalars['Float']['output']>;
  baseRatePerMinute: Maybe<Scalars['Float']['output']>;
  completedAt: Maybe<Scalars['AWSDateTime']['output']>;
  createdAt: Scalars['AWSDateTime']['output'];
  description: Maybe<Scalars['String']['output']>;
  inProgressTimeoutInMinutes: Maybe<Scalars['Int']['output']>;
  isConcurrent: Maybe<Scalars['Boolean']['output']>;
  lastUpdatedAt: Scalars['AWSDateTime']['output'];
  maximumRatePerMinute: Maybe<Scalars['Float']['output']>;
  numberOfRetries: Maybe<Scalars['Int']['output']>;
  stats: JobProcessStats;
  status: Scalars['String']['output'];
  targetSelection: Scalars['String']['output'];
  targets: Array<Scalars['String']['output']>;
}

export interface JobExecution {
  executionNumber: Scalars['Int']['output'];
  jobId: Scalars['String']['output'];
  lastUpdatedAt: Scalars['AWSDateTime']['output'];
  queuedAt: Scalars['AWSDateTime']['output'];
  retryAttempt: Scalars['Int']['output'];
  startedAt: Maybe<Scalars['AWSDateTime']['output']>;
  status: Scalars['String']['output'];
  thingName: Scalars['String']['output'];
}

export interface JobListPreferences {
  contentDensity: Maybe<Scalars['String']['output']>;
  contentDisplay: Maybe<Array<ContentDisplay>>;
  pageSize: Maybe<Scalars['Int']['output']>;
  stickyColumns: Maybe<StickyColumns>;
  stripedRows: Maybe<Scalars['Boolean']['output']>;
  visibleContent: Maybe<Array<Scalars['String']['output']>>;
  wrapLines: Maybe<Scalars['Boolean']['output']>;
}

export interface JobListPreferencesInput {
  columnWidths: InputMaybe<Array<Scalars['Float']['input']>>;
  contentDensity: InputMaybe<Scalars['String']['input']>;
  contentDisplay: InputMaybe<Array<ContentDisplayInput>>;
  pageSize: InputMaybe<Scalars['Int']['input']>;
  stickyColumns: InputMaybe<StickyColumnsInput>;
  stripedRows: InputMaybe<Scalars['Boolean']['input']>;
  visibleContent: InputMaybe<Array<Scalars['String']['input']>>;
  wrapLines: InputMaybe<Scalars['Boolean']['input']>;
}

export interface JobProcessStats {
  canceled: Scalars['Int']['output'];
  failed: Scalars['Int']['output'];
  inProgress: Scalars['Int']['output'];
  queued: Scalars['Int']['output'];
  rejected: Scalars['Int']['output'];
  removed: Scalars['Int']['output'];
  succeeded: Scalars['Int']['output'];
  timedOut: Scalars['Int']['output'];
}

export interface JobSummary {
  completedAt: Maybe<Scalars['AWSDateTime']['output']>;
  createdAt: Scalars['AWSDateTime']['output'];
  isConcurrent: Scalars['Boolean']['output'];
  jobArn: Scalars['String']['output'];
  jobId: Scalars['String']['output'];
  lastUpdatedAt: Scalars['AWSDateTime']['output'];
  status: Scalars['String']['output'];
  targetSelection: Scalars['String']['output'];
}

export interface MetricData {
  metric: Scalars['String']['output'];
  timestamp: Scalars['AWSDateTime']['output'];
  value: Scalars['Float']['output'];
}

export interface Mutation {
  createDeviceStats: DeviceStats;
  putPersistedUserPreferences: PersistedUserPreferences;
}

export interface MutationCreateDeviceStatsArgs {
  input: DeviceStatsInput;
}

export interface MutationPutPersistedUserPreferencesArgs {
  input: PersistedUserPreferencesInput;
}

export interface PaginatedJobExecutions {
  items: Maybe<Array<JobExecution>>;
  nextToken: Maybe<Scalars['String']['output']>;
}

export interface PaginatedJobs {
  items: Maybe<Array<JobSummary>>;
  nextToken: Maybe<Scalars['String']['output']>;
}

export interface PaginatedThings {
  items: Maybe<Array<ThingSummary>>;
  nextToken: Maybe<Scalars['String']['output']>;
}

export interface PersistedUserPreferences {
  deviceList: DeviceListPreferences;
  jobList: JobListPreferences;
}

export interface PersistedUserPreferencesInput {
  deviceList: DeviceListPreferencesInput;
  jobList: JobListPreferencesInput;
}

export interface Query {
  getCloudwatchMetricData: Maybe<Array<MetricData>>;
  getDefenderMetricData: Maybe<Array<MetricData>>;
  getDevice: Maybe<Device>;
  getJobDetails: Maybe<JobDetails>;
  getLatestDeviceStats: Maybe<DeviceStats>;
  getLatestVersionStats: Maybe<DeviceStats>;
  getPersistedUserPreferences: Maybe<PersistedUserPreferences>;
  getRetainedTopic: Maybe<RetainedTopic>;
  getThingCount: Scalars['Int']['output'];
  getThingShadow: Maybe<Scalars['AWSJSON']['output']>;
  listJobExecutionsForJob: PaginatedJobExecutions;
  listJobExecutionsForThing: PaginatedJobExecutions;
  listJobs: PaginatedJobs;
  listThingGroups: Maybe<ThingGroupResponse>;
  listThings: PaginatedThings;
}

export interface QueryGetCloudwatchMetricDataArgs {
  period: InputMaybe<Scalars['Int']['input']>;
  start: InputMaybe<Scalars['AWSDateTime']['input']>;
  type: CloudwatchMetricType;
}

export interface QueryGetDefenderMetricDataArgs {
  endTime: InputMaybe<Scalars['AWSDateTime']['input']>;
  startTime: InputMaybe<Scalars['AWSDateTime']['input']>;
  thingName: Scalars['String']['input'];
  type: DefenderMetricType;
}

export interface QueryGetDeviceArgs {
  thingName: Scalars['String']['input'];
}

export interface QueryGetJobDetailsArgs {
  jobId: Scalars['String']['input'];
}

export interface QueryGetRetainedTopicArgs {
  thingName: Scalars['String']['input'];
  topicName: RetainedTopicSuffix;
}

export interface QueryGetThingCountArgs {
  filter: InputMaybe<FilterResolverInput>;
}

export interface QueryGetThingShadowArgs {
  shadowName: InputMaybe<Scalars['String']['input']>;
  thingName: Scalars['String']['input'];
}

export interface QueryListJobExecutionsForJobArgs {
  jobId: Scalars['String']['input'];
  limit: InputMaybe<Scalars['Int']['input']>;
  nextToken: InputMaybe<Scalars['String']['input']>;
}

export interface QueryListJobExecutionsForThingArgs {
  limit: InputMaybe<Scalars['Int']['input']>;
  nextToken: InputMaybe<Scalars['String']['input']>;
  thingName: Scalars['String']['input'];
}

export interface QueryListJobsArgs {
  limit: InputMaybe<Scalars['Int']['input']>;
  nextToken: InputMaybe<Scalars['String']['input']>;
}

export interface QueryListThingsArgs {
  filter: InputMaybe<FilterResolverInput>;
  limit: InputMaybe<Scalars['Int']['input']>;
  nextToken: InputMaybe<Scalars['String']['input']>;
}

export interface RetainedTopic {
  payload: Scalars['AWSJSON']['output'];
  timestamp: Scalars['AWSTimestamp']['output'];
  topic: Scalars['String']['output'];
}

export enum RetainedTopicSuffix {
  Info = 'info',
  Meta = 'meta',
  Sensor = 'sensor'
}

export interface StickyColumns {
  first: Maybe<Scalars['Int']['output']>;
  last: Maybe<Scalars['Int']['output']>;
}

export interface StickyColumnsInput {
  first: InputMaybe<Scalars['Int']['input']>;
  last: InputMaybe<Scalars['Int']['input']>;
}

export interface Subscription {
  onNewDeviceStats: Maybe<DeviceStats>;
}

export interface ThingGroup {
  childGroups: Array<ThingGroup>;
  groupName: Scalars['String']['output'];
  groupType: Scalars['String']['output'];
}

export interface ThingGroupResponse {
  groups: Array<ThingGroup>;
}

export interface ThingSummary {
  brandName: Scalars['String']['output'];
  connected: Scalars['Boolean']['output'];
  country: Scalars['String']['output'];
  deviceType: Scalars['String']['output'];
  disconnectReason: Maybe<Scalars['String']['output']>;
  firmwareType: Maybe<Scalars['String']['output']>;
  firmwareVersion: Maybe<Scalars['String']['output']>;
  hasApplianceFW: Scalars['Boolean']['output'];
  lastConnectedAt: Maybe<Scalars['AWSTimestamp']['output']>;
  productionTimestamp: Scalars['AWSTimestamp']['output'];
  provisioningTimestamp: Scalars['AWSTimestamp']['output'];
  thingGroupNames: Array<Scalars['String']['output']>;
  thingName: Scalars['String']['output'];
}

export type PutPersistedUserPreferencesMutationVariables = Exact<{
  input: PersistedUserPreferencesInput;
}>;

export type PutPersistedUserPreferencesMutation = {
  putPersistedUserPreferences: {
    deviceList: {
      favoriteDevices: Array<string> | null;
      visibleContent: Array<string> | null;
      pageSize: number | null;
      wrapLines: boolean | null;
      stripedRows: boolean | null;
      contentDensity: string | null;
      contentDisplay: Array<{
        id: string | null;
        visible: boolean | null;
        width: number | null;
      }> | null;
      stickyColumns: { first: number | null; last: number | null } | null;
      filterObjects: Array<{
        name: string;
        operation: FilterOperation;
        filters: Array<{
          fieldName: string;
          operator: FilterOperator;
          value: string;
        }> | null;
      }> | null;
    };
    jobList: {
      visibleContent: Array<string> | null;
      pageSize: number | null;
      wrapLines: boolean | null;
      stripedRows: boolean | null;
      contentDensity: string | null;
      contentDisplay: Array<{
        id: string | null;
        visible: boolean | null;
        width: number | null;
      }> | null;
      stickyColumns: { first: number | null; last: number | null } | null;
    };
  };
};

export type ListThingsQueryVariables = Exact<{
  limit: InputMaybe<Scalars['Int']['input']>;
  nextToken: InputMaybe<Scalars['String']['input']>;
  filter: InputMaybe<FilterResolverInput>;
}>;

export type ListThingsQuery = {
  listThings: {
    nextToken: string | null;
    items: Array<{
      thingName: string;
      deviceType: string;
      connected: boolean;
      lastConnectedAt: number | null;
      disconnectReason: string | null;
      provisioningTimestamp: number;
      productionTimestamp: number;
      brandName: string;
      country: string;
      hasApplianceFW: boolean;
      firmwareType: string | null;
      firmwareVersion: string | null;
      thingGroupNames: Array<string>;
    }> | null;
  };
};

export type ListJobsQueryVariables = Exact<{
  limit: InputMaybe<Scalars['Int']['input']>;
  nextToken: InputMaybe<Scalars['String']['input']>;
}>;

export type ListJobsQuery = {
  listJobs: {
    nextToken: string | null;
    items: Array<{
      jobId: string;
      status: string;
      createdAt: string;
      lastUpdatedAt: string;
      completedAt: string | null;
    }> | null;
  };
};

export type ListJobExecutionsForJobQueryVariables = Exact<{
  jobId: Scalars['String']['input'];
  limit: InputMaybe<Scalars['Int']['input']>;
  nextToken: InputMaybe<Scalars['String']['input']>;
}>;

export type ListJobExecutionsForJobQuery = {
  listJobExecutionsForJob: {
    nextToken: string | null;
    items: Array<{
      thingName: string;
      lastUpdatedAt: string;
      queuedAt: string;
      retryAttempt: number;
      startedAt: string | null;
      status: string;
    }> | null;
  };
};

export type ListJobExecutionsForThingQueryVariables = Exact<{
  thingName: Scalars['String']['input'];
  limit: InputMaybe<Scalars['Int']['input']>;
  nextToken: InputMaybe<Scalars['String']['input']>;
}>;

export type ListJobExecutionsForThingQuery = {
  listJobExecutionsForThing: {
    nextToken: string | null;
    items: Array<{
      jobId: string;
      lastUpdatedAt: string;
      queuedAt: string;
      retryAttempt: number;
      startedAt: string | null;
      status: string;
    }> | null;
  };
};

export type GetJobDetailsQueryVariables = Exact<{
  jobId: Scalars['String']['input'];
}>;

export type GetJobDetailsQuery = {
  getJobDetails: {
    targetSelection: string;
    status: string;
    targets: Array<string>;
    description: string | null;
    maximumRatePerMinute: number | null;
    baseRatePerMinute: number | null;
    abortThresholdPercentage: number | null;
    createdAt: string;
    lastUpdatedAt: string;
    completedAt: string | null;
    inProgressTimeoutInMinutes: number | null;
    numberOfRetries: number | null;
    stats: {
      canceled: number;
      succeeded: number;
      failed: number;
      rejected: number;
      queued: number;
      inProgress: number;
      removed: number;
      timedOut: number;
    };
  } | null;
};

export type GetDeviceQueryVariables = Exact<{
  thingName: Scalars['String']['input'];
}>;

export type GetDeviceQuery = {
  getDevice: {
    thingName: string;
    connected: boolean;
    lastConnectedAt: number | null;
    deviceType: string;
    deviceGroups: Array<string>;
    disconnectReason: string | null;
    attributes: string;
    firmwareType: string | null;
    firmwareVersion: string | null;
  } | null;
};

export type GetLatestDeviceStatsQueryVariables = Exact<{
  [key: string]: never;
}>;

export type GetLatestDeviceStatsQuery = {
  getLatestDeviceStats: {
    status: string;
    recordTime: string;
    registeredDevices: number;
    connectedDevices: number;
    disconnectedDevices: number;
    brandNameDistribution: string | null;
    countryDistribution: string;
    productTypeDistribution: string;
    disconnectDistribution: string;
    groupDistribution: string;
    deviceTypeDistribution: string;
  } | null;
};

export type GetLatestFleetStatsQueryVariables = Exact<{ [key: string]: never }>;

export type GetLatestFleetStatsQuery = {
  getLatestDeviceStats: {
    recordTime: string;
    disconnectDistribution: string;
    registeredDevices: number;
    connectedDevices: number;
    disconnectedDevices: number;
  } | null;
};

export type GetLatestVersionStatsQueryVariables = Exact<{
  [key: string]: never;
}>;

export type GetLatestVersionStatsQuery = {
  getLatestDeviceStats: {
    recordTime: string;
    versionDistribution: string;
  } | null;
};

export type GetThingShadowQueryVariables = Exact<{
  thingName: Scalars['String']['input'];
  shadowName: InputMaybe<Scalars['String']['input']>;
}>;

export type GetThingShadowQuery = { getThingShadow: string | null };

export type GetRetainedTopicQueryVariables = Exact<{
  thingName: Scalars['String']['input'];
  topicName: RetainedTopicSuffix;
}>;

export type GetRetainedTopicQuery = {
  getRetainedTopic: {
    topic: string;
    payload: string;
    timestamp: number;
  } | null;
};

export type GetThingCountQueryVariables = Exact<{
  filter: InputMaybe<FilterResolverInput>;
}>;

export type GetThingCountQuery = { getThingCount: number };

export type GetCloudwatchMetricDataQueryVariables = Exact<{
  type: CloudwatchMetricType;
  period: InputMaybe<Scalars['Int']['input']>;
  start: InputMaybe<Scalars['AWSDateTime']['input']>;
}>;

export type GetCloudwatchMetricDataQuery = {
  getCloudwatchMetricData: Array<{
    metric: string;
    timestamp: string;
    value: number;
  }> | null;
};

export type GetDefenderMetricDataQueryVariables = Exact<{
  thingName: Scalars['String']['input'];
  type: DefenderMetricType;
  startTime: InputMaybe<Scalars['AWSDateTime']['input']>;
  endTime: InputMaybe<Scalars['AWSDateTime']['input']>;
}>;

export type GetDefenderMetricDataQuery = {
  getDefenderMetricData: Array<{
    metric: string;
    timestamp: string;
    value: number;
  }> | null;
};

export type GetPersistedUserPreferencesQueryVariables = Exact<{
  [key: string]: never;
}>;

export type GetPersistedUserPreferencesQuery = {
  getPersistedUserPreferences: {
    deviceList: {
      favoriteDevices: Array<string> | null;
      visibleContent: Array<string> | null;
      pageSize: number | null;
      wrapLines: boolean | null;
      stripedRows: boolean | null;
      contentDensity: string | null;
      contentDisplay: Array<{
        id: string | null;
        visible: boolean | null;
        width: number | null;
      }> | null;
      stickyColumns: { first: number | null; last: number | null } | null;
      filterObjects: Array<{
        name: string;
        operation: FilterOperation;
        filters: Array<{
          fieldName: string;
          operator: FilterOperator;
          value: string;
        }> | null;
      }> | null;
    };
    jobList: {
      visibleContent: Array<string> | null;
      pageSize: number | null;
      wrapLines: boolean | null;
      stripedRows: boolean | null;
      contentDensity: string | null;
      contentDisplay: Array<{
        id: string | null;
        visible: boolean | null;
        width: number | null;
      }> | null;
      stickyColumns: { first: number | null; last: number | null } | null;
    };
  } | null;
};

export type ListThingGroupsQueryVariables = Exact<{ [key: string]: never }>;

export type ListThingGroupsQuery = {
  listThingGroups: {
    groups: Array<{
      groupName: string;
      groupType: string;
      childGroups: Array<{
        groupName: string;
        groupType: string;
        childGroups: Array<{
          groupName: string;
          groupType: string;
          childGroups: Array<{
            groupName: string;
            groupType: string;
            childGroups: Array<{ groupName: string; groupType: string }>;
          }>;
        }>;
      }>;
    }>;
  } | null;
};

export type OnNewDeviceStatsSubscriptionVariables = Exact<{
  [key: string]: never;
}>;

export type OnNewDeviceStatsSubscription = {
  onNewDeviceStats: {
    status: string;
    recordTime: string;
    registeredDevices: number;
    connectedDevices: number;
    disconnectedDevices: number;
    brandNameDistribution: string | null;
    countryDistribution: string;
    productTypeDistribution: string;
    disconnectDistribution: string;
    groupDistribution: string;
    deviceTypeDistribution: string;
  } | null;
};

export const PutPersistedUserPreferencesDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'putPersistedUserPreferences' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: {
            kind: 'Variable',
            name: { kind: 'Name', value: 'input' }
          },
          type: {
            kind: 'NonNullType',
            type: {
              kind: 'NamedType',
              name: { kind: 'Name', value: 'PersistedUserPreferencesInput' }
            }
          }
        }
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'putPersistedUserPreferences' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'input' },
                value: {
                  kind: 'Variable',
                  name: { kind: 'Name', value: 'input' }
                }
              }
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'deviceList' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'favoriteDevices' }
                      },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'contentDisplay' },
                        selectionSet: {
                          kind: 'SelectionSet',
                          selections: [
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'id' }
                            },
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'visible' }
                            },
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'width' }
                            }
                          ]
                        }
                      },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'visibleContent' }
                      },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'pageSize' }
                      },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'wrapLines' }
                      },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'stripedRows' }
                      },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'contentDensity' }
                      },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'stickyColumns' },
                        selectionSet: {
                          kind: 'SelectionSet',
                          selections: [
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'first' }
                            },
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'last' }
                            }
                          ]
                        }
                      },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'filterObjects' },
                        selectionSet: {
                          kind: 'SelectionSet',
                          selections: [
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'name' }
                            },
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'filters' },
                              selectionSet: {
                                kind: 'SelectionSet',
                                selections: [
                                  {
                                    kind: 'Field',
                                    name: { kind: 'Name', value: 'fieldName' }
                                  },
                                  {
                                    kind: 'Field',
                                    name: { kind: 'Name', value: 'operator' }
                                  },
                                  {
                                    kind: 'Field',
                                    name: { kind: 'Name', value: 'value' }
                                  }
                                ]
                              }
                            },
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'operation' }
                            }
                          ]
                        }
                      }
                    ]
                  }
                },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'jobList' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'contentDisplay' },
                        selectionSet: {
                          kind: 'SelectionSet',
                          selections: [
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'id' }
                            },
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'visible' }
                            },
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'width' }
                            }
                          ]
                        }
                      },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'visibleContent' }
                      },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'pageSize' }
                      },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'wrapLines' }
                      },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'stripedRows' }
                      },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'contentDensity' }
                      },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'stickyColumns' },
                        selectionSet: {
                          kind: 'SelectionSet',
                          selections: [
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'first' }
                            },
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'last' }
                            }
                          ]
                        }
                      }
                    ]
                  }
                }
              ]
            }
          }
        ]
      }
    }
  ]
} as unknown as DocumentNode<
  PutPersistedUserPreferencesMutation,
  PutPersistedUserPreferencesMutationVariables
>;
export const ListThingsDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'ListThings' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: {
            kind: 'Variable',
            name: { kind: 'Name', value: 'limit' }
          },
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'Int' } }
        },
        {
          kind: 'VariableDefinition',
          variable: {
            kind: 'Variable',
            name: { kind: 'Name', value: 'nextToken' }
          },
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } }
        },
        {
          kind: 'VariableDefinition',
          variable: {
            kind: 'Variable',
            name: { kind: 'Name', value: 'filter' }
          },
          type: {
            kind: 'NamedType',
            name: { kind: 'Name', value: 'FilterResolverInput' }
          }
        }
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'listThings' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'limit' },
                value: {
                  kind: 'Variable',
                  name: { kind: 'Name', value: 'limit' }
                }
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'nextToken' },
                value: {
                  kind: 'Variable',
                  name: { kind: 'Name', value: 'nextToken' }
                }
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'filter' },
                value: {
                  kind: 'Variable',
                  name: { kind: 'Name', value: 'filter' }
                }
              }
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'items' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'thingName' }
                      },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'deviceType' }
                      },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'connected' }
                      },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'lastConnectedAt' }
                      },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'disconnectReason' }
                      },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'provisioningTimestamp' }
                      },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'productionTimestamp' }
                      },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'brandName' }
                      },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'country' }
                      },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'hasApplianceFW' }
                      },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'firmwareType' }
                      },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'firmwareVersion' }
                      },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'thingGroupNames' }
                      }
                    ]
                  }
                },
                { kind: 'Field', name: { kind: 'Name', value: 'nextToken' } }
              ]
            }
          }
        ]
      }
    }
  ]
} as unknown as DocumentNode<ListThingsQuery, ListThingsQueryVariables>;
export const ListJobsDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'ListJobs' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: {
            kind: 'Variable',
            name: { kind: 'Name', value: 'limit' }
          },
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'Int' } }
        },
        {
          kind: 'VariableDefinition',
          variable: {
            kind: 'Variable',
            name: { kind: 'Name', value: 'nextToken' }
          },
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } }
        }
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'listJobs' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'limit' },
                value: {
                  kind: 'Variable',
                  name: { kind: 'Name', value: 'limit' }
                }
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'nextToken' },
                value: {
                  kind: 'Variable',
                  name: { kind: 'Name', value: 'nextToken' }
                }
              }
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'items' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'jobId' } },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'status' }
                      },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'createdAt' }
                      },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'lastUpdatedAt' }
                      },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'completedAt' }
                      }
                    ]
                  }
                },
                { kind: 'Field', name: { kind: 'Name', value: 'nextToken' } }
              ]
            }
          }
        ]
      }
    }
  ]
} as unknown as DocumentNode<ListJobsQuery, ListJobsQueryVariables>;
export const ListJobExecutionsForJobDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'ListJobExecutionsForJob' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: {
            kind: 'Variable',
            name: { kind: 'Name', value: 'jobId' }
          },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } }
          }
        },
        {
          kind: 'VariableDefinition',
          variable: {
            kind: 'Variable',
            name: { kind: 'Name', value: 'limit' }
          },
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'Int' } }
        },
        {
          kind: 'VariableDefinition',
          variable: {
            kind: 'Variable',
            name: { kind: 'Name', value: 'nextToken' }
          },
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } }
        }
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'listJobExecutionsForJob' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'jobId' },
                value: {
                  kind: 'Variable',
                  name: { kind: 'Name', value: 'jobId' }
                }
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'limit' },
                value: {
                  kind: 'Variable',
                  name: { kind: 'Name', value: 'limit' }
                }
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'nextToken' },
                value: {
                  kind: 'Variable',
                  name: { kind: 'Name', value: 'nextToken' }
                }
              }
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'items' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'thingName' }
                      },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'lastUpdatedAt' }
                      },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'queuedAt' }
                      },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'retryAttempt' }
                      },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'startedAt' }
                      },
                      { kind: 'Field', name: { kind: 'Name', value: 'status' } }
                    ]
                  }
                },
                { kind: 'Field', name: { kind: 'Name', value: 'nextToken' } }
              ]
            }
          }
        ]
      }
    }
  ]
} as unknown as DocumentNode<
  ListJobExecutionsForJobQuery,
  ListJobExecutionsForJobQueryVariables
>;
export const ListJobExecutionsForThingDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'ListJobExecutionsForThing' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: {
            kind: 'Variable',
            name: { kind: 'Name', value: 'thingName' }
          },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } }
          }
        },
        {
          kind: 'VariableDefinition',
          variable: {
            kind: 'Variable',
            name: { kind: 'Name', value: 'limit' }
          },
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'Int' } }
        },
        {
          kind: 'VariableDefinition',
          variable: {
            kind: 'Variable',
            name: { kind: 'Name', value: 'nextToken' }
          },
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } }
        }
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'listJobExecutionsForThing' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'thingName' },
                value: {
                  kind: 'Variable',
                  name: { kind: 'Name', value: 'thingName' }
                }
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'limit' },
                value: {
                  kind: 'Variable',
                  name: { kind: 'Name', value: 'limit' }
                }
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'nextToken' },
                value: {
                  kind: 'Variable',
                  name: { kind: 'Name', value: 'nextToken' }
                }
              }
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'items' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'jobId' } },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'lastUpdatedAt' }
                      },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'queuedAt' }
                      },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'retryAttempt' }
                      },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'startedAt' }
                      },
                      { kind: 'Field', name: { kind: 'Name', value: 'status' } }
                    ]
                  }
                },
                { kind: 'Field', name: { kind: 'Name', value: 'nextToken' } }
              ]
            }
          }
        ]
      }
    }
  ]
} as unknown as DocumentNode<
  ListJobExecutionsForThingQuery,
  ListJobExecutionsForThingQueryVariables
>;
export const GetJobDetailsDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'GetJobDetails' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: {
            kind: 'Variable',
            name: { kind: 'Name', value: 'jobId' }
          },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } }
          }
        }
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'getJobDetails' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'jobId' },
                value: {
                  kind: 'Variable',
                  name: { kind: 'Name', value: 'jobId' }
                }
              }
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'targetSelection' }
                },
                { kind: 'Field', name: { kind: 'Name', value: 'status' } },
                { kind: 'Field', name: { kind: 'Name', value: 'targets' } },
                { kind: 'Field', name: { kind: 'Name', value: 'description' } },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'maximumRatePerMinute' }
                },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'baseRatePerMinute' }
                },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'abortThresholdPercentage' }
                },
                { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'lastUpdatedAt' }
                },
                { kind: 'Field', name: { kind: 'Name', value: 'completedAt' } },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'stats' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'canceled' }
                      },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'succeeded' }
                      },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'failed' }
                      },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'rejected' }
                      },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'queued' }
                      },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'inProgress' }
                      },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'removed' }
                      },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'timedOut' }
                      }
                    ]
                  }
                },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'inProgressTimeoutInMinutes' }
                },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'numberOfRetries' }
                }
              ]
            }
          }
        ]
      }
    }
  ]
} as unknown as DocumentNode<GetJobDetailsQuery, GetJobDetailsQueryVariables>;
export const GetDeviceDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'GetDevice' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: {
            kind: 'Variable',
            name: { kind: 'Name', value: 'thingName' }
          },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } }
          }
        }
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'getDevice' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'thingName' },
                value: {
                  kind: 'Variable',
                  name: { kind: 'Name', value: 'thingName' }
                }
              }
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'thingName' } },
                { kind: 'Field', name: { kind: 'Name', value: 'connected' } },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'lastConnectedAt' }
                },
                { kind: 'Field', name: { kind: 'Name', value: 'deviceType' } },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'deviceGroups' }
                },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'disconnectReason' }
                },
                { kind: 'Field', name: { kind: 'Name', value: 'attributes' } },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'firmwareType' }
                },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'firmwareVersion' }
                }
              ]
            }
          }
        ]
      }
    }
  ]
} as unknown as DocumentNode<GetDeviceQuery, GetDeviceQueryVariables>;
export const GetLatestDeviceStatsDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'GetLatestDeviceStats' },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'getLatestDeviceStats' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'status' } },
                { kind: 'Field', name: { kind: 'Name', value: 'recordTime' } },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'registeredDevices' }
                },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'connectedDevices' }
                },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'disconnectedDevices' }
                },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'brandNameDistribution' }
                },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'countryDistribution' }
                },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'productTypeDistribution' }
                },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'disconnectDistribution' }
                },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'groupDistribution' }
                },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'deviceTypeDistribution' }
                }
              ]
            }
          }
        ]
      }
    }
  ]
} as unknown as DocumentNode<
  GetLatestDeviceStatsQuery,
  GetLatestDeviceStatsQueryVariables
>;
export const GetLatestFleetStatsDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'GetLatestFleetStats' },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'getLatestDeviceStats' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'recordTime' } },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'disconnectDistribution' }
                },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'registeredDevices' }
                },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'connectedDevices' }
                },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'disconnectedDevices' }
                }
              ]
            }
          }
        ]
      }
    }
  ]
} as unknown as DocumentNode<
  GetLatestFleetStatsQuery,
  GetLatestFleetStatsQueryVariables
>;
export const GetLatestVersionStatsDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'GetLatestVersionStats' },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'getLatestDeviceStats' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'recordTime' } },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'versionDistribution' }
                }
              ]
            }
          }
        ]
      }
    }
  ]
} as unknown as DocumentNode<
  GetLatestVersionStatsQuery,
  GetLatestVersionStatsQueryVariables
>;
export const GetThingShadowDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'GetThingShadow' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: {
            kind: 'Variable',
            name: { kind: 'Name', value: 'thingName' }
          },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } }
          }
        },
        {
          kind: 'VariableDefinition',
          variable: {
            kind: 'Variable',
            name: { kind: 'Name', value: 'shadowName' }
          },
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } }
        }
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'getThingShadow' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'thingName' },
                value: {
                  kind: 'Variable',
                  name: { kind: 'Name', value: 'thingName' }
                }
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'shadowName' },
                value: {
                  kind: 'Variable',
                  name: { kind: 'Name', value: 'shadowName' }
                }
              }
            ]
          }
        ]
      }
    }
  ]
} as unknown as DocumentNode<GetThingShadowQuery, GetThingShadowQueryVariables>;
export const GetRetainedTopicDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'GetRetainedTopic' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: {
            kind: 'Variable',
            name: { kind: 'Name', value: 'thingName' }
          },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } }
          }
        },
        {
          kind: 'VariableDefinition',
          variable: {
            kind: 'Variable',
            name: { kind: 'Name', value: 'topicName' }
          },
          type: {
            kind: 'NonNullType',
            type: {
              kind: 'NamedType',
              name: { kind: 'Name', value: 'RetainedTopicSuffix' }
            }
          }
        }
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'getRetainedTopic' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'thingName' },
                value: {
                  kind: 'Variable',
                  name: { kind: 'Name', value: 'thingName' }
                }
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'topicName' },
                value: {
                  kind: 'Variable',
                  name: { kind: 'Name', value: 'topicName' }
                }
              }
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'topic' } },
                { kind: 'Field', name: { kind: 'Name', value: 'payload' } },
                { kind: 'Field', name: { kind: 'Name', value: 'timestamp' } }
              ]
            }
          }
        ]
      }
    }
  ]
} as unknown as DocumentNode<
  GetRetainedTopicQuery,
  GetRetainedTopicQueryVariables
>;
export const GetThingCountDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'GetThingCount' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: {
            kind: 'Variable',
            name: { kind: 'Name', value: 'filter' }
          },
          type: {
            kind: 'NamedType',
            name: { kind: 'Name', value: 'FilterResolverInput' }
          }
        }
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'getThingCount' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'filter' },
                value: {
                  kind: 'Variable',
                  name: { kind: 'Name', value: 'filter' }
                }
              }
            ]
          }
        ]
      }
    }
  ]
} as unknown as DocumentNode<GetThingCountQuery, GetThingCountQueryVariables>;
export const GetCloudwatchMetricDataDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'GetCloudwatchMetricData' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'type' } },
          type: {
            kind: 'NonNullType',
            type: {
              kind: 'NamedType',
              name: { kind: 'Name', value: 'CloudwatchMetricType' }
            }
          }
        },
        {
          kind: 'VariableDefinition',
          variable: {
            kind: 'Variable',
            name: { kind: 'Name', value: 'period' }
          },
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'Int' } }
        },
        {
          kind: 'VariableDefinition',
          variable: {
            kind: 'Variable',
            name: { kind: 'Name', value: 'start' }
          },
          type: {
            kind: 'NamedType',
            name: { kind: 'Name', value: 'AWSDateTime' }
          }
        }
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'getCloudwatchMetricData' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'type' },
                value: {
                  kind: 'Variable',
                  name: { kind: 'Name', value: 'type' }
                }
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'period' },
                value: {
                  kind: 'Variable',
                  name: { kind: 'Name', value: 'period' }
                }
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'start' },
                value: {
                  kind: 'Variable',
                  name: { kind: 'Name', value: 'start' }
                }
              }
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'metric' } },
                { kind: 'Field', name: { kind: 'Name', value: 'timestamp' } },
                { kind: 'Field', name: { kind: 'Name', value: 'value' } }
              ]
            }
          }
        ]
      }
    }
  ]
} as unknown as DocumentNode<
  GetCloudwatchMetricDataQuery,
  GetCloudwatchMetricDataQueryVariables
>;
export const GetDefenderMetricDataDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'GetDefenderMetricData' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: {
            kind: 'Variable',
            name: { kind: 'Name', value: 'thingName' }
          },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } }
          }
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'type' } },
          type: {
            kind: 'NonNullType',
            type: {
              kind: 'NamedType',
              name: { kind: 'Name', value: 'DefenderMetricType' }
            }
          }
        },
        {
          kind: 'VariableDefinition',
          variable: {
            kind: 'Variable',
            name: { kind: 'Name', value: 'startTime' }
          },
          type: {
            kind: 'NamedType',
            name: { kind: 'Name', value: 'AWSDateTime' }
          }
        },
        {
          kind: 'VariableDefinition',
          variable: {
            kind: 'Variable',
            name: { kind: 'Name', value: 'endTime' }
          },
          type: {
            kind: 'NamedType',
            name: { kind: 'Name', value: 'AWSDateTime' }
          }
        }
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'getDefenderMetricData' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'thingName' },
                value: {
                  kind: 'Variable',
                  name: { kind: 'Name', value: 'thingName' }
                }
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'type' },
                value: {
                  kind: 'Variable',
                  name: { kind: 'Name', value: 'type' }
                }
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'startTime' },
                value: {
                  kind: 'Variable',
                  name: { kind: 'Name', value: 'startTime' }
                }
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'endTime' },
                value: {
                  kind: 'Variable',
                  name: { kind: 'Name', value: 'endTime' }
                }
              }
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'metric' } },
                { kind: 'Field', name: { kind: 'Name', value: 'timestamp' } },
                { kind: 'Field', name: { kind: 'Name', value: 'value' } }
              ]
            }
          }
        ]
      }
    }
  ]
} as unknown as DocumentNode<
  GetDefenderMetricDataQuery,
  GetDefenderMetricDataQueryVariables
>;
export const GetPersistedUserPreferencesDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'GetPersistedUserPreferences' },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'getPersistedUserPreferences' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'deviceList' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'favoriteDevices' }
                      },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'contentDisplay' },
                        selectionSet: {
                          kind: 'SelectionSet',
                          selections: [
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'id' }
                            },
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'visible' }
                            },
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'width' }
                            }
                          ]
                        }
                      },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'visibleContent' }
                      },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'pageSize' }
                      },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'wrapLines' }
                      },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'stripedRows' }
                      },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'contentDensity' }
                      },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'stickyColumns' },
                        selectionSet: {
                          kind: 'SelectionSet',
                          selections: [
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'first' }
                            },
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'last' }
                            }
                          ]
                        }
                      },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'filterObjects' },
                        selectionSet: {
                          kind: 'SelectionSet',
                          selections: [
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'name' }
                            },
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'filters' },
                              selectionSet: {
                                kind: 'SelectionSet',
                                selections: [
                                  {
                                    kind: 'Field',
                                    name: { kind: 'Name', value: 'fieldName' }
                                  },
                                  {
                                    kind: 'Field',
                                    name: { kind: 'Name', value: 'operator' }
                                  },
                                  {
                                    kind: 'Field',
                                    name: { kind: 'Name', value: 'value' }
                                  }
                                ]
                              }
                            },
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'operation' }
                            }
                          ]
                        }
                      }
                    ]
                  }
                },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'jobList' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'contentDisplay' },
                        selectionSet: {
                          kind: 'SelectionSet',
                          selections: [
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'id' }
                            },
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'visible' }
                            },
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'width' }
                            }
                          ]
                        }
                      },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'visibleContent' }
                      },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'pageSize' }
                      },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'wrapLines' }
                      },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'stripedRows' }
                      },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'contentDensity' }
                      },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'stickyColumns' },
                        selectionSet: {
                          kind: 'SelectionSet',
                          selections: [
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'first' }
                            },
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'last' }
                            }
                          ]
                        }
                      }
                    ]
                  }
                }
              ]
            }
          }
        ]
      }
    }
  ]
} as unknown as DocumentNode<
  GetPersistedUserPreferencesQuery,
  GetPersistedUserPreferencesQueryVariables
>;
export const ListThingGroupsDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'ListThingGroups' },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'listThingGroups' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'groups' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'groupName' }
                      },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'groupType' }
                      },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'childGroups' },
                        selectionSet: {
                          kind: 'SelectionSet',
                          selections: [
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'groupName' }
                            },
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'groupType' }
                            },
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'childGroups' },
                              selectionSet: {
                                kind: 'SelectionSet',
                                selections: [
                                  {
                                    kind: 'Field',
                                    name: { kind: 'Name', value: 'groupName' }
                                  },
                                  {
                                    kind: 'Field',
                                    name: { kind: 'Name', value: 'groupType' }
                                  },
                                  {
                                    kind: 'Field',
                                    name: {
                                      kind: 'Name',
                                      value: 'childGroups'
                                    },
                                    selectionSet: {
                                      kind: 'SelectionSet',
                                      selections: [
                                        {
                                          kind: 'Field',
                                          name: {
                                            kind: 'Name',
                                            value: 'groupName'
                                          }
                                        },
                                        {
                                          kind: 'Field',
                                          name: {
                                            kind: 'Name',
                                            value: 'groupType'
                                          }
                                        },
                                        {
                                          kind: 'Field',
                                          name: {
                                            kind: 'Name',
                                            value: 'childGroups'
                                          },
                                          selectionSet: {
                                            kind: 'SelectionSet',
                                            selections: [
                                              {
                                                kind: 'Field',
                                                name: {
                                                  kind: 'Name',
                                                  value: 'groupName'
                                                }
                                              },
                                              {
                                                kind: 'Field',
                                                name: {
                                                  kind: 'Name',
                                                  value: 'groupType'
                                                }
                                              }
                                            ]
                                          }
                                        }
                                      ]
                                    }
                                  }
                                ]
                              }
                            }
                          ]
                        }
                      }
                    ]
                  }
                }
              ]
            }
          }
        ]
      }
    }
  ]
} as unknown as DocumentNode<
  ListThingGroupsQuery,
  ListThingGroupsQueryVariables
>;
export const OnNewDeviceStatsDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'subscription',
      name: { kind: 'Name', value: 'OnNewDeviceStats' },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'onNewDeviceStats' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'status' } },
                { kind: 'Field', name: { kind: 'Name', value: 'recordTime' } },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'registeredDevices' }
                },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'connectedDevices' }
                },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'disconnectedDevices' }
                },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'brandNameDistribution' }
                },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'countryDistribution' }
                },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'productTypeDistribution' }
                },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'disconnectDistribution' }
                },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'groupDistribution' }
                },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'deviceTypeDistribution' }
                }
              ]
            }
          }
        ]
      }
    }
  ]
} as unknown as DocumentNode<
  OnNewDeviceStatsSubscription,
  OnNewDeviceStatsSubscriptionVariables
>;

export interface Schema {
  query: Query;
  mutation: Mutation;
  subscription: Subscription;
}
