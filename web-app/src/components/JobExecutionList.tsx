/**
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at

 *   http://www.apache.org/licenses/LICENSE-2.0

 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 *
 */

import {
  useEffect,
  useState,
  type FunctionComponent,
  type ReactElement
} from 'react';

import unionBy from 'lodash/unionBy';

import { client } from '../config/appsync-config';
import {
  ListJobExecutionsForJobDocument,
  ListJobExecutionsForThingDocument,
  type ListJobExecutionsForJobQuery,
  type ListJobExecutionsForJobQueryVariables,
  type ListJobExecutionsForThingQuery,
  type ListJobExecutionsForThingQueryVariables
} from '@bfw/shared/src/appsync';
import { JobExecutionStatus } from '@aws-sdk/client-iot';
import type { GenericReactState } from '@bfw/shared/src/types';
import type { GraphQLResult } from '@aws-amplify/api-graphql';
import { type FollowFunction, useFollow } from '../hooks/UseFollow';
import type { StatusIndicatorProps } from '@cloudscape-design/components/status-indicator';
import type { CollectionPreferencesProps } from '@cloudscape-design/components/collection-preferences';
import type { NonCancelableCustomEvent } from '@cloudscape-design/components/interfaces';
import Table, { type TableProps } from '@cloudscape-design/components/table';
import Pagination from '@cloudscape-design/components/pagination';
import Link from '@cloudscape-design/components/link';
import Button from '@cloudscape-design/components/button';
import SpaceBetween from '@cloudscape-design/components/space-between';
import Header from '@cloudscape-design/components/header';
import CollectionPreferences from '@cloudscape-design/components/collection-preferences';
import StatusIndicator from '@cloudscape-design/components/status-indicator';
import Box from '@cloudscape-design/components/box';
import type { AmplifyQuery } from '../utils/AmplifyQuery';
import {
  useCollection,
  type PropertyFilterProperty,
  type PropertyFilterQuery,
  type UseCollectionResult
} from '@cloudscape-design/collection-hooks';
import { dateFilteringMapFunction } from './DeviceListFilter';
import PropertyFilter from '@cloudscape-design/components/property-filter';
import { useSearchParams, type SetURLSearchParams } from 'react-router-dom';
import { parseJsonNoThrow } from '@bfw/shared/src/utils';

type PreferencesType = CollectionPreferencesProps.Preferences;
type JobExecution = NonNullable<
  ListJobExecutionsForJobQuery['listJobExecutionsForJob']['items']
>[0] &
  NonNullable<
    ListJobExecutionsForThingQuery['listJobExecutionsForThing']['items']
  >[0];
type HydratedJobExecution = Omit<
  JobExecution,
  'startedAt' | 'queuedAt' | 'lastUpdatedAt'
> & {
  queuedAt: Date | null;
  startedAt: Date | null;
  lastUpdatedAt: Date | null;
};

type JobExecutionListProps =
  | {
      jobId: string;
    }
  | {
      thingName: string;
    };

// Define a default page size
const DEFAULT_PAGE_SIZE: number = 20;

const statusIndicatorMapping: Record<
  JobExecutionStatus,
  StatusIndicatorProps.Type
> = {
  [JobExecutionStatus.CANCELED]: 'stopped',
  [JobExecutionStatus.FAILED]: 'error',
  [JobExecutionStatus.IN_PROGRESS]: 'in-progress',
  [JobExecutionStatus.QUEUED]: 'pending',
  [JobExecutionStatus.REJECTED]: 'error',
  [JobExecutionStatus.REMOVED]: 'stopped',
  [JobExecutionStatus.SUCCEEDED]: 'success',
  [JobExecutionStatus.TIMED_OUT]: 'error'
};

const statusTextMapping: Record<JobExecutionStatus, string> = {
  [JobExecutionStatus.CANCELED]: 'Canceled',
  [JobExecutionStatus.FAILED]: 'Failed',
  [JobExecutionStatus.IN_PROGRESS]: 'In-Progress',
  [JobExecutionStatus.SUCCEEDED]: 'Succeeded',
  [JobExecutionStatus.TIMED_OUT]: 'Timed-Out',
  [JobExecutionStatus.REJECTED]: 'Rejected',
  [JobExecutionStatus.QUEUED]: 'Queued',
  [JobExecutionStatus.REMOVED]: 'Removed'
};

export const JobExecutionList: FunctionComponent<JobExecutionListProps> = (
  props: JobExecutionListProps
): ReactElement => {
  const listKey: string = 'jobId' in props ? 'thingName' : 'jobId';

  const columnMapping: Omit<
    Record<keyof HydratedJobExecution, string>,
    'jobId' | 'thingName'
  > = {
    [listKey]: listKey === 'jobId' ? 'Job ID' : 'Serial Number',
    status: 'Status',
    retryAttempt: 'Attempts',
    queuedAt: 'Queued At',
    startedAt: 'Started At',
    lastUpdatedAt: 'Last Updated At'
  };

  const handleFollow: FollowFunction = useFollow();
  const [searchParams, setSearchParams]: [URLSearchParams, SetURLSearchParams] =
    useSearchParams();
  const [jobExecutions, setJobExecutions]: GenericReactState<
    Array<HydratedJobExecution>
  > = useState<Array<HydratedJobExecution>>([]);
  const [loading, setLoading]: GenericReactState<boolean> = useState(false);
  const [, setError]: GenericReactState<string | null> = useState<
    string | null
  >(null);

  // Initialize preferences with proper default values
  const [preferences, setPreferences]: GenericReactState<PreferencesType> =
    useState<PreferencesType>((): PreferencesType => {
      const savedPreferences: string | null =
        localStorage.getItem('jobListPreferences');
      const defaultPreferences: PreferencesType = {
        pageSize: DEFAULT_PAGE_SIZE,
        visibleContent: Object.keys(columnMapping),
        wrapLines: true,
        stripedRows: true,
        contentDensity: 'comfortable'
      };

      if (savedPreferences) {
        try {
          // Merge saved preferences with defaults to ensure all properties exist
          return {
            ...defaultPreferences,
            ...JSON.parse(savedPreferences)
          } as PreferencesType;
        } catch (error: unknown) {
          console.error('Error parsing saved preferences:', error);
          return defaultPreferences;
        }
      }

      return defaultPreferences;
    });

  // Handle preference changes
  function confirmPreferences(
    event: NonCancelableCustomEvent<CollectionPreferencesProps.Preferences>
  ): void {
    setPreferences(event.detail);
    localStorage.setItem('jobListPreferences', JSON.stringify(event.detail));
  }

  const {
    items,
    filteredItemsCount,
    collectionProps,
    propertyFilterProps,
    paginationProps
  }: UseCollectionResult<HydratedJobExecution> = useCollection(jobExecutions, {
    propertyFiltering: {
      empty: (
        <Box margin={{ vertical: 'xs' }} textAlign="center" color="inherit">
          <SpaceBetween size="m">
            <b>No Jobs</b>
          </SpaceBetween>
        </Box>
      ),
      noMatch: (
        <Box margin={{ vertical: 'xs' }} textAlign="center" color="inherit">
          <SpaceBetween size="m">
            <b>No Executions</b>
            {jobExecutions.length > 0 && (
              <Button onClick={(): void => setSearchParams()}>
                Clear filter
              </Button>
            )}
          </SpaceBetween>
        </Box>
      ),
      defaultQuery: searchParams.has('query')
        ? parseJsonNoThrow(searchParams.get('query')!)
        : undefined,
      freeTextFiltering: {
        defaultOperator: ':',
        operators: [':', '!:']
      },
      filteringProperties: Object.entries(columnMapping).map(
        ([key, label]: [string, string]): PropertyFilterProperty => ({
          key,
          operators: ['queuedAt', 'startedAt', 'lastUpdatedAt'].includes(key)
            ? ['<', '<=', '>', '>='].map(dateFilteringMapFunction)
            : key === 'retryAttempt'
              ? ['<', '<=', '>', '>=']
              : [':', '!:'],
          propertyLabel: label,
          defaultOperator: [
            'queuedAt',
            'startedAt',
            'lastUpdatedAt',
            'retryAttempt'
          ].includes(key)
            ? '>='
            : ':',
          groupValuesLabel: 'Suggestions'
        })
      )
    },
    pagination: { pageSize: preferences.pageSize },
    sorting: {
      defaultState: {
        sortingColumn: {
          sortingField: 'lastUpdatedAt'
        },
        isDescending: true
      }
    },
    selection: {
      trackBy: listKey
    }
  });

  async function fetchJobExecutions(): Promise<void> {
    // Prevent concurrent requests
    if (loading) return;

    console.log('Fetching job executions');
    setLoading(true);
    setJobExecutions([]);
    setError(null);

    // Add timeout to prevent infinite hanging
    const timeoutPromise: Promise<never> = new Promise(
      (_: (result: never) => void, reject: (error: Error) => void): void => {
        setTimeout((): void => reject(new Error('Request timeout')), 10000);
      }
    );
    let nextToken: string | null | undefined;
    do {
      const queryPromise: Promise<
        GraphQLResult<
          ListJobExecutionsForJobQuery | ListJobExecutionsForThingQuery
        >
      > = client.graphql<
        AmplifyQuery<
          | ListJobExecutionsForJobQueryVariables
          | ListJobExecutionsForThingQueryVariables,
          ListJobExecutionsForJobQuery | ListJobExecutionsForThingQuery
        >
      >({
        query:
          'jobId' in props
            ? ListJobExecutionsForJobDocument
            : ListJobExecutionsForThingDocument,
        variables: {
          ...props,
          limit: nextToken ? null : preferences.pageSize || null,
          nextToken: nextToken || null
        }
      });

      const response: GraphQLResult<
        ListJobExecutionsForJobQuery | ListJobExecutionsForThingQuery
      > = await Promise.race([queryPromise, timeoutPromise]);
      if (!nextToken) {
        setLoading(false);
      }
      nextToken =
        (response.data as ListJobExecutionsForJobQuery).listJobExecutionsForJob
          ?.nextToken ||
        (response.data as ListJobExecutionsForThingQuery)
          .listJobExecutionsForThing?.nextToken ||
        undefined;

      // Add more detailed logging
      if (response.errors) {
        console.error('GraphQL Errors:', response.errors);
        throw new AggregateError(response.errors);
      }

      if (!response.data) {
        throw new Error('No data field in response');
      }
      const newJobExecutions: Array<HydratedJobExecution> = (
        ((response.data as ListJobExecutionsForJobQuery).listJobExecutionsForJob
          ?.items ||
          (response.data as ListJobExecutionsForThingQuery)
            .listJobExecutionsForThing?.items ||
          []) as Array<JobExecution>
      ).map(
        (jobExecution: JobExecution): HydratedJobExecution => ({
          ...jobExecution,
          queuedAt: jobExecution.queuedAt
            ? new Date(jobExecution.queuedAt)
            : null,
          startedAt: jobExecution.startedAt
            ? new Date(jobExecution.startedAt)
            : null,
          lastUpdatedAt: jobExecution.lastUpdatedAt
            ? new Date(jobExecution.lastUpdatedAt)
            : null
        })
      );
      setJobExecutions(
        (prev: Array<HydratedJobExecution>): Array<HydratedJobExecution> =>
          unionBy(prev, newJobExecutions, listKey)
      );
    } while (nextToken);
  }

  // Add initial load effect
  useEffect((): void => {
    console.log('Initial job execution fetch');
    fetchJobExecutions().catch((error: Error): void => {
      console.error('Error in initial fetch:', error);
      setLoading(false);
      setJobExecutions([]);
      setError(error.message);
    });
  }, []);

  useEffect((): void => {
    if (searchParams.has('query')) {
      propertyFilterProps.onChange({
        detail: parseJsonNoThrow(searchParams.get('query')!, {
          tokens: [],
          operation: 'and'
        })
      });
    } else {
      propertyFilterProps.onChange({
        detail: {
          tokens: [],
          operation: 'and'
        }
      });
    }
  }, [searchParams]);

  return (
    <Table<HydratedJobExecution>
      {...collectionProps}
      loading={loading}
      loadingText="Loading job executions..."
      items={items}
      pagination={
        <Pagination
          {...paginationProps}
          ariaLabels={{
            nextPageLabel: 'Next page',
            previousPageLabel: 'Previous page',
            pageLabel: (pageNumber: number): string =>
              `Page ${pageNumber} of all pages`
          }}
        />
      }
      columnDefinitions={Object.entries(columnMapping).map(
        ([id, header]: [
          string,
          string
        ]): TableProps.ColumnDefinition<HydratedJobExecution> => ({
          id,
          header,
          cell: (item: HydratedJobExecution): ReactElement | string => {
            if (id === 'jobId') {
              return (
                <Link href={`/jobs/${item.jobId}`} onFollow={handleFollow}>
                  {item.jobId}
                </Link>
              );
            }
            if (id === 'thingName') {
              return (
                <Link
                  href={`/devices/${item.thingName}`}
                  onFollow={handleFollow}
                >
                  {item.thingName}
                </Link>
              );
            }
            if (id === 'status' && item.status) {
              return (
                <StatusIndicator
                  type={
                    statusIndicatorMapping[item.status as JobExecutionStatus]
                  }
                >
                  {statusTextMapping[item.status as JobExecutionStatus]}
                </StatusIndicator>
              );
            }
            if (
              ['queuedAt', 'startedAt', 'lastUpdatedAt'].includes(id) &&
              item[id as keyof HydratedJobExecution]
            ) {
              return new Date(
                item[id as keyof HydratedJobExecution]!
              ).toLocaleString();
            }
            return (item[id as keyof HydratedJobExecution] as string) || '-';
          },
          sortingField: id
        })
      )}
      resizableColumns
      header={
        <Header
          counter={`(${jobExecutions.length})`}
          actions={
            <SpaceBetween size="xs" direction="horizontal">
              <Button
                onClick={(): void => {
                  fetchJobExecutions().catch(console.error);
                }}
              >
                Refresh
              </Button>
            </SpaceBetween>
          }
        >
          Executions
        </Header>
      }
      filter={
        <PropertyFilter
          {...propertyFilterProps}
          onChange={({
            detail
          }: NonCancelableCustomEvent<PropertyFilterQuery>): void =>
            setSearchParams(
              detail.tokens.length ? { query: JSON.stringify(detail) } : {}
            )
          }
          filteringPlaceholder="Find executions"
          countText={`${filteredItemsCount} matches`}
        />
      }
      preferences={
        <CollectionPreferences
          title="Preferences"
          confirmLabel="Confirm"
          cancelLabel="Cancel"
          preferences={preferences}
          onConfirm={confirmPreferences}
          pageSizePreference={{
            title: 'Items per page',
            options: [
              { value: 10, label: '10 items' },
              { value: 20, label: '20 items' },
              { value: 50, label: '50 items' }
            ]
          }}
          wrapLinesPreference={{
            label: 'Wrap lines',
            description: 'Check to see all the text and wrap the lines'
          }}
          stripedRowsPreference={{
            label: 'Striped rows',
            description: 'Check to add alternating row striping'
          }}
          contentDensityPreference={{
            label: 'Content density',
            description: 'Select content density'
          }}
          visibleContentPreference={{
            title: 'Select visible columns',
            options: [
              {
                label: 'Job properties',
                options: Object.entries(columnMapping).map(
                  ([id, label]: [string, string]): {
                    id: string;
                    label: string;
                  } => ({
                    id,
                    label
                  })
                )
              }
            ]
          }}
        />
      }
      wrapLines={preferences.wrapLines}
      stripedRows={preferences.stripedRows}
      contentDensity={preferences.contentDensity}
      columnDisplay={preferences.visibleContent?.map(
        (id: string): TableProps.ColumnDisplayProperties => ({
          id,
          visible: true
        })
      )}
    />
  );
};
