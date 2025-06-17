/**
 * Copyright 2025 Amazon.com, Inc. and its affiliates. All Rights Reserved.
 *
 * Licensed under the Amazon Software License (the "License").
 * You may not use this file except in compliance with the License.
 * A copy of the License is located at
 *
 *   http://aws.amazon.com/asl/
 *
 * or in the "license" file accompanying this file. This file is distributed
 * on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either
 * express or implied. See the License for the specific language governing
 * permissions and limitations under the License.
 *
 */

import {
  useEffect,
  useState,
  type FunctionComponent,
  type ReactElement,
  useCallback
} from 'react';

import unionBy from 'lodash/unionBy';

import { client } from '../config/appsync-config';
import {
  type ContentDisplay,
  ListJobsDocument,
  type ListJobsQuery,
  type ListJobsQueryVariables,
  type PersistedUserPreferences
} from '@bfw/shared/src/appsync';
import { JobStatus } from '@aws-sdk/client-iot';
import type { GenericReactState } from '@bfw/shared/src/types';
import {
  usePersistedUserPreferences,
  type UsePersistedUserPreferencesHook
} from '../hooks/UsePersistedUserPreferences';
// TODO: export type to shared file
import type { NonCancelableEventHandler } from '../hooks/UseLocalDeviceListPreferences';
import type { GraphQLResult } from '@aws-amplify/api-graphql';
import { type FollowFunction, useFollow } from '../hooks/UseFollow';
import type { CollectionPreferencesProps } from '@cloudscape-design/components/collection-preferences';
import type { StatusIndicatorProps } from '@cloudscape-design/components/status-indicator';
import type { NonCancelableCustomEvent } from '@cloudscape-design/components/interfaces';
import Table, { type TableProps } from '@cloudscape-design/components/table';
import Pagination from '@cloudscape-design/components/pagination';
import Link from '@cloudscape-design/components/link';
import StatusIndicator from '@cloudscape-design/components/status-indicator';
import Header from '@cloudscape-design/components/header';
import SpaceBetween from '@cloudscape-design/components/space-between';
import Button from '@cloudscape-design/components/button';
import CollectionPreferences from '@cloudscape-design/components/collection-preferences';
import Box from '@cloudscape-design/components/box';
import { findWidthInContentDisplay } from '../utils/PreferencesUtil';
import type { AmplifyQuery } from '../utils/AmplifyQuery';
import {
  useCollection,
  type PropertyFilterProperty,
  type PropertyFilterQuery,
  type UseCollectionResult
} from '@cloudscape-design/collection-hooks';
import PropertyFilter from '@cloudscape-design/components/property-filter';
import { dateFilteringMapFunction } from './DeviceListFilter';
import { useSearchParams, type SetURLSearchParams } from 'react-router-dom';
import { parseJsonNoThrow } from '@bfw/shared/src/utils';

type PreferencesType = CollectionPreferencesProps.Preferences;
type JobSummary = NonNullable<ListJobsQuery['listJobs']['items']>[0];
type HydratedJobSummary = Omit<
  JobSummary,
  'createdAt' | 'lastUpdatedAt' | 'completedAt'
> & {
  createdAt: Date | null;
  lastUpdatedAt: Date | null;
  completedAt: Date | null;
};

// Define a default page size
const DEFAULT_PAGE_SIZE: number = 20;

const columnMapping: Record<keyof HydratedJobSummary, string> = {
  jobId: 'Job ID',
  status: 'Status',
  createdAt: 'Created At',
  lastUpdatedAt: 'Last Updated At',
  completedAt: 'Completed At'
};

const statusMapping: Record<string, StatusIndicatorProps.Type> = {
  [JobStatus.SCHEDULED]: 'pending',
  [JobStatus.IN_PROGRESS]: 'in-progress',
  [JobStatus.CANCELED]: 'stopped',
  [JobStatus.COMPLETED]: 'success',
  [JobStatus.DELETION_IN_PROGRESS]: 'warning'
};

export const JobList: FunctionComponent = (): ReactElement => {
  const handleFollow: FollowFunction = useFollow();
  const [searchParams, setSearchParams]: [URLSearchParams, SetURLSearchParams] =
    useSearchParams();
  const [isInitialLoadComplete, setIsInitialLoadComplete]: [
    boolean,
    (value: ((prevState: boolean) => boolean) | boolean) => void
  ] = useState(false);
  const {
    persistedUserPreferences,
    refreshPersistedUserPreferences,
    putPersistedUserPreferences,
    setLocalPersistedUserPreferences
  }: UsePersistedUserPreferencesHook = usePersistedUserPreferences();
  const [jobs, setJobs]: GenericReactState<Array<HydratedJobSummary>> =
    useState<Array<HydratedJobSummary>>([]);
  const [loading, setLoading]: GenericReactState<boolean> = useState(false);
  const [, setError]: GenericReactState<string | null> = useState<
    string | null
  >(null);
  const [
    localPreferences,
    setLocalPreferences
  ]: GenericReactState<PreferencesType> = useState<PreferencesType>(
    (): PreferencesType => {
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
            ...(JSON.parse(savedPreferences) as PreferencesType)
          };
        } catch (error: unknown) {
          console.error('Error parsing saved preferences:', error);
          return defaultPreferences;
        }
      }

      return defaultPreferences;
    }
  );

  // Handle preference changes
  function confirmLocalPreferences(
    event: NonCancelableCustomEvent<CollectionPreferencesProps.Preferences>
  ): void {
    setLocalPreferences(event.detail);
    localStorage.setItem('jobListPreferences', JSON.stringify(event.detail));
  }

  const handlePreferencesChange: NonCancelableEventHandler<CollectionPreferencesProps.Preferences> =
    useCallback(
      (
        event: NonCancelableCustomEvent<CollectionPreferencesProps.Preferences>
      ): void => {
        setIsInitialLoadComplete(false);
        const newPreferences: CollectionPreferencesProps.Preferences =
          event.detail;
        confirmLocalPreferences(event);
        const updatedPersistedUserPreferences: PersistedUserPreferences = {
          ...persistedUserPreferences,
          jobList: {
            ...persistedUserPreferences.jobList,
            pageSize: newPreferences.pageSize || null,
            contentDisplay:
              newPreferences.contentDisplay?.map(
                (
                  content: CollectionPreferencesProps.ContentDisplayItem
                ): ContentDisplay => {
                  return {
                    id: content.id,
                    visible: content.visible || false,
                    width: findWidthInContentDisplay(
                      content.id,
                      persistedUserPreferences.jobList.contentDisplay
                    )
                  };
                }
              ) || [],
            visibleContent:
              newPreferences.contentDisplay
                ?.filter(
                  (
                    content: CollectionPreferencesProps.ContentDisplayItem
                  ): boolean => {
                    return content.visible;
                  }
                )
                .map(
                  (
                    content: CollectionPreferencesProps.ContentDisplayItem
                  ): string => content.id
                ) || []
          }
        };
        setLocalPersistedUserPreferences(updatedPersistedUserPreferences);
        putPersistedUserPreferences(updatedPersistedUserPreferences)
          .then((): void => {
            setLocalPreferences({
              ...updatedPersistedUserPreferences.jobList
            } as CollectionPreferencesProps.Preferences);
            setIsInitialLoadComplete(true);
          })
          .catch(console.error);
      },
      [
        persistedUserPreferences,
        localPreferences.pageSize,
        confirmLocalPreferences
      ]
    );

  const handleColumnWidthsChange: (
    columnWidthsChangeDetail: NonCancelableCustomEvent<TableProps.ColumnWidthsChangeDetail>
  ) => void = useCallback(
    (
      columnWidthsChangeDetail: NonCancelableCustomEvent<TableProps.ColumnWidthsChangeDetail>
    ): void => {
      const updatedPersistedUserPreferences: PersistedUserPreferences = {
        ...persistedUserPreferences,
        jobList: {
          ...persistedUserPreferences.jobList,
          contentDisplay: persistedUserPreferences.jobList.contentDisplay
            ? persistedUserPreferences.jobList.contentDisplay?.map(
                (item: ContentDisplay, index: number): ContentDisplay => {
                  if (item) {
                    item.width = columnWidthsChangeDetail.detail.widths[index];
                  }
                  return item;
                }
              )
            : null
        }
      };
      setLocalPersistedUserPreferences(updatedPersistedUserPreferences);
      putPersistedUserPreferences(updatedPersistedUserPreferences).catch(
        console.error
      );
    },
    [persistedUserPreferences]
  );
  const {
    items,
    filteredItemsCount,
    collectionProps,
    propertyFilterProps,
    paginationProps
  }: UseCollectionResult<HydratedJobSummary> = useCollection(jobs, {
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
            <b>No Jobs</b>
            {jobs.length > 0 && (
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
          operators: ['createdAt', 'lastUpdatedAt', 'completedAt'].includes(key)
            ? ['<', '<=', '>', '>='].map(dateFilteringMapFunction)
            : [':', '!:'],
          propertyLabel: label,
          defaultOperator: [
            'createdAt',
            'lastUpdatedAt',
            'completedAt'
          ].includes(key)
            ? '>='
            : ':',
          groupValuesLabel: 'Suggestions'
        })
      )
    },
    pagination: { pageSize: localPreferences.pageSize },
    sorting: {
      defaultState: {
        sortingColumn: {
          sortingField: 'lastUpdatedAt'
        },
        isDescending: true
      }
    },
    selection: {
      trackBy: 'jobId'
    }
  });

  async function fetchJobs(): Promise<void> {
    // Prevent concurrent requests
    if (loading) return;

    console.log('Fetching jobs');
    setLoading(true);
    setJobs([]);
    setError(null);

    // Add timeout to prevent infinite hanging
    const timeoutPromise: Promise<never> = new Promise(
      (_: (result: never) => void, reject: (error: Error) => void): void => {
        setTimeout((): void => reject(new Error('Request timeout')), 10000);
      }
    );
    let nextToken: string | null | undefined;
    do {
      const queryPromise: Promise<GraphQLResult<ListJobsQuery>> =
        client.graphql<AmplifyQuery<ListJobsQueryVariables, ListJobsQuery>>({
          query: ListJobsDocument,
          variables: {
            limit: nextToken ? null : localPreferences.pageSize || null,
            nextToken: nextToken || null
          }
        });

      const response: GraphQLResult<ListJobsQuery> = await Promise.race([
        queryPromise,
        timeoutPromise
      ]);
      if (!nextToken) {
        setLoading(false);
      }
      nextToken = response.data?.listJobs.nextToken;

      // Add more detailed logging
      if (response.errors) {
        console.error('GraphQL Errors:', response.errors);
        throw new AggregateError(response.errors);
      }

      if (!response.data) {
        throw new Error('No data field in response');
      }

      if (!response.data.listJobs) {
        throw new Error('No listJobs field in response data');
      }

      const newJobs: Array<HydratedJobSummary> = (
        response.data.listJobs.items || []
      ).map((item: JobSummary): HydratedJobSummary => {
        return {
          ...item,
          createdAt: item.createdAt ? new Date(item.createdAt) : null,
          lastUpdatedAt: item.lastUpdatedAt
            ? new Date(item.lastUpdatedAt)
            : null,
          completedAt: item.completedAt ? new Date(item.completedAt) : null
        };
      });
      setJobs(
        (prev: Array<HydratedJobSummary>): Array<HydratedJobSummary> =>
          unionBy(prev, newJobs, 'jobId')
      );
    } while (nextToken);
  }

  // Add initial load effect
  useEffect((): void => {
    console.log('Initial jobs and persisted user preferences fetch');

    async function getPersistedUserPreferences(): Promise<void> {
      const refreshedPersistedUserPreferences: PersistedUserPreferences =
        await refreshPersistedUserPreferences();
      setLocalPreferences({
        ...refreshedPersistedUserPreferences.jobList
      } as CollectionPreferencesProps.Preferences);
      setIsInitialLoadComplete(true);
    }

    getPersistedUserPreferences().catch(console.error);
    fetchJobs().catch((error: Error): void => {
      console.error('Error in initial fetch:', error);
      setLoading(false);
      setJobs([]);
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

  function getColumnDefinitions(
    persistedUserPreferences: PersistedUserPreferences
  ): TableProps.ColumnDefinition<HydratedJobSummary>[] {
    return Object.entries(columnMapping).map(
      ([id, header]: [
        string,
        string
      ]): TableProps.ColumnDefinition<HydratedJobSummary> => ({
        id,
        header,
        cell: (item: HydratedJobSummary): ReactElement | string => {
          if (id === 'jobId') {
            return (
              <Link href={`/jobs/${item.jobId}`} onFollow={handleFollow}>
                {item.jobId}
              </Link>
            );
          }
          if (id === 'status' && item.status) {
            return (
              <StatusIndicator type={statusMapping[item.status]}>
                <span style={{ textTransform: 'capitalize' }}>
                  {statusMapping[item.status]}
                </span>
              </StatusIndicator>
            );
          }
          if (
            ['createdAt', 'lastUpdatedAt', 'completedAt'].includes(id) &&
            item[id as keyof HydratedJobSummary]
          ) {
            return new Date(
              item[id as keyof HydratedJobSummary]!
            ).toLocaleString();
          }
          return (item[id as keyof HydratedJobSummary] as string) || '-';
        },
        sortingField: id,
        width: findWidthInContentDisplay(
          id,
          persistedUserPreferences.jobList.contentDisplay || null
        )
      })
    );
  }

  return (
    <Table<HydratedJobSummary>
      {...collectionProps}
      loading={loading || !isInitialLoadComplete}
      loadingText={
        !isInitialLoadComplete ? 'Initializing...' : 'Loading jobs...'
      }
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
      columnDefinitions={getColumnDefinitions(persistedUserPreferences)}
      resizableColumns
      onColumnWidthsChange={handleColumnWidthsChange}
      header={
        <Header
          counter={`(${jobs.length})`}
          actions={
            <SpaceBetween size="xs" direction="horizontal">
              <Button
                onClick={(): void => {
                  fetchJobs().catch(console.error);
                }}
              >
                Refresh
              </Button>
            </SpaceBetween>
          }
        >
          Jobs
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
          filteringPlaceholder="Find job"
          countText={`${filteredItemsCount} matches`}
        />
      }
      preferences={
        <CollectionPreferences
          title="Preferences"
          confirmLabel="Confirm"
          cancelLabel="Cancel"
          preferences={localPreferences}
          onConfirm={handlePreferencesChange}
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
          contentDisplayPreference={{
            title: 'Select visible columns and their order',
            options: Object.entries(columnMapping).map(
              ([id, label]: [string, string]): {
                id: string;
                label: string;
              } => ({
                id,
                label
              })
            )
          }}
        />
      }
      wrapLines={localPreferences.wrapLines}
      stripedRows={localPreferences.stripedRows}
      contentDensity={localPreferences.contentDensity}
      columnDisplay={localPreferences.visibleContent?.map(
        (id: string): TableProps.ColumnDisplayProperties => ({
          id,
          visible: true
        })
      )}
    />
  );
};
