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
  type FunctionComponent,
  type ReactElement,
  useCallback,
  useEffect,
  useMemo,
  useState
} from 'react';

import {
  DEFAULT_PAGE_SIZE,
  defaultPreferencesConfig,
  type NonCancelableEventHandler,
  type UseDeviceListPreferencesHook,
  useLocalDeviceListPreferences
} from '../hooks/UseLocalDeviceListPreferences';
import {
  useDeviceData,
  type UseDeviceDataReturn
} from '../hooks/UseDeviceData';
import { getDeviceTableColumns } from './DeviceTableConfig';
import Pagination, {
  type PaginationProps
} from '@cloudscape-design/components/pagination';
import type { CollectionPreferencesProps } from '@cloudscape-design/components/collection-preferences';
import CollectionPreferences from '@cloudscape-design/components/collection-preferences';
import { DeviceListFilter } from './DeviceListFilter';
import {
  type UseThingCountHook,
  useThingsCount
} from '../hooks/UseThingsCount';
import {
  debounce,
  isEmpty,
  isEqual,
  xorWith,
  type DebouncedFunc
} from 'lodash';
import type { GenericReactState } from '@bfw/shared/src/types';
import {
  usePersistedUserPreferences,
  type UsePersistedUserPreferencesHook
} from '../hooks/UsePersistedUserPreferences';
import {
  type ContentDisplay,
  type Filter,
  type FilterInput,
  FilterOperation,
  type FilterPreference,
  type FilterResolverInput,
  type PersistedUserPreferences,
  type ThingSummary
} from '@bfw/shared/src/appsync';
import { type FollowFunction, useFollow } from '../hooks/UseFollow';
import type { NonCancelableCustomEvent } from '@cloudscape-design/components/interfaces';
import type { TableProps } from '@cloudscape-design/components/table';
import Table from '@cloudscape-design/components/table';
import Header from '@cloudscape-design/components/header';
import SpaceBetween from '@cloudscape-design/components/space-between';
import Button from '@cloudscape-design/components/button';
import Spinner from '@cloudscape-design/components/spinner';
import type { PropertyFilterQuery } from '@cloudscape-design/collection-hooks';
import {
  convertFilterPreferenceToPropertyFilterQuery,
  convertPropertyFilterQueryToFilterResolverInput,
  convertPropertyFilterQueryToURLSearchParams,
  convertURLSearchParamsToFilterResolverInput
} from '../utils/FilterUtil.ts';
import { findWidthInContentDisplay } from '../utils/PreferencesUtil.ts';
import { formatTimestamp } from '../utils/TimestampUtil.ts';
import Box from '@cloudscape-design/components/box';
import { useSearchParams, type SetURLSearchParams } from 'react-router-dom';
import Select from '@cloudscape-design/components/select';
import type { SelectProps } from '@cloudscape-design/components/select';
import { type InputProps } from '@cloudscape-design/components/input';
import FormField from '@cloudscape-design/components/form-field';
import Modal from '@cloudscape-design/components/modal';
import type { AutosuggestProps } from '@cloudscape-design/components/autosuggest';
import Autosuggest from '@cloudscape-design/components/autosuggest';

export const DeviceList: FunctionComponent = (): ReactElement => {
  const [searchParams, setSearchParams]: [URLSearchParams, SetURLSearchParams] =
    useSearchParams();
  const [isInitialLoadComplete, setIsInitialLoadComplete]: [
    boolean,
    (value: ((previousState: boolean) => boolean) | boolean) => void
  ] = useState(false);
  const [query, setQuery]: [
    PropertyFilterQuery,
    (
      value:
        | ((previousState: PropertyFilterQuery) => PropertyFilterQuery)
        | PropertyFilterQuery
    ) => void
  ] = useState({
    tokens: [],
    operation: FilterOperation.And
  } as PropertyFilterQuery);
  const [filter, setFilter]: GenericReactState<FilterResolverInput | null> =
    useState<FilterResolverInput | null>(null);
  const [favoriteDevices, setFavoriteDevices]: GenericReactState<Set<string>> =
    useState<Set<string>>(new Set());
  const [
    showSaveQueryDialog,
    setShowSaveQueryDialog
  ]: GenericReactState<boolean> = useState<boolean>(false);
  const [saveFilterName, setSaveFilterName]: GenericReactState<string> =
    useState<string>('');
  const [
    selectedQuery,
    setSelectedQuery
  ]: GenericReactState<SelectProps.Option | null> =
    useState<SelectProps.Option | null>(null);
  const [querySelectOptions, setQuerySelectOptions]: GenericReactState<
    Array<SelectProps.Option>
  > = useState<Array<SelectProps.Option>>([]);
  const {
    persistedUserPreferences,
    refreshPersistedUserPreferences,
    putPersistedUserPreferences,
    setLocalPersistedUserPreferences
  }: UsePersistedUserPreferencesHook = usePersistedUserPreferences();
  const [currentPageIndex, setCurrentPageIndex]: GenericReactState<number> =
    useState(1);
  const {
    localPreferences,
    confirmLocalPreferences,
    setLocalPreferences
  }: UseDeviceListPreferencesHook = useLocalDeviceListPreferences(
    defaultPreferencesConfig
  );
  const {
    count,
    error: countError,
    refetch: refetchCount
  }: UseThingCountHook = useThingsCount({
    filter: null
  });
  const offset: number = useMemo(
    (): number =>
      (currentPageIndex - 1) * (localPreferences.pageSize || DEFAULT_PAGE_SIZE),
    [currentPageIndex, localPreferences.pageSize]
  );
  const {
    devices,
    loading,
    fetchDevices: rawFetchDevices
  }: UseDeviceDataReturn = useDeviceData({
    pageSize: localPreferences.pageSize || DEFAULT_PAGE_SIZE,
    offset,
    currentPage: currentPageIndex,
    filter
  });
  const memoizedFetchDevices: (
    page: number,
    signal?: AbortSignal
  ) => Promise<void> = useCallback(
    (page: number, signal?: AbortSignal): Promise<void> => {
      return rawFetchDevices(
        'memoizedFetchDevices',
        page,
        null,
        filter,
        signal
      );
    },
    [rawFetchDevices, filter]
  );

  // hooks
  useEffect((): void => {
    async function getPersistedUserPreferences(): Promise<void> {
      setIsInitialLoadComplete(false);
      const refreshedPersistedUserPreferences: PersistedUserPreferences =
        await refreshPersistedUserPreferences();
      const persistedFavoriteDevices: Array<string> =
        refreshedPersistedUserPreferences.deviceList.favoriteDevices ?? [];
      setFavoriteDevices(new Set<string>(persistedFavoriteDevices));
      setLocalPreferences({
        ...refreshedPersistedUserPreferences.deviceList
      } as CollectionPreferencesProps.Preferences);
      // load preferences from storage
      const filterPreference: FilterPreference =
        refreshedPersistedUserPreferences.deviceList.filterObjects?.[0] ?? {
          name: 'default',
          filters: null,
          operation: FilterOperation.And
        };
      // configure drop down options
      if (refreshedPersistedUserPreferences.deviceList.filterObjects) {
        setQuerySelectOptions(
          refreshedPersistedUserPreferences.deviceList.filterObjects.map(
            (
              filterPreference: FilterPreference,
              index: number
            ): SelectProps.Option => {
              return {
                label: filterPreference.name,
                value: String(index)
              };
            }
          )
        );
      }
      // overwrite filter with URL params if present
      if (searchParams.has('query')) {
        console.log('here');
        const filterResolverInput: FilterResolverInput =
          convertURLSearchParamsToFilterResolverInput(
            searchParams,
            Array.from(persistedFavoriteDevices)
          );
        setFilter(filterResolverInput);
        refetchCount(filterResolverInput).catch(console.error);
      } else {
        // ensure that no stored filter takes precedence over URL
        if (
          refreshedPersistedUserPreferences.deviceList.filterObjects &&
          refreshedPersistedUserPreferences.deviceList.filterObjects?.length > 0
        ) {
          setSelectedQuery({
            label:
              refreshedPersistedUserPreferences.deviceList.filterObjects[0]
                .name,
            value: '0'
          });
        }
        const filterResolverInput: FilterResolverInput = {
          filters: filterPreference.filters,
          operation: filterPreference.operation,
          favoriteDevices: Array.from(persistedFavoriteDevices)
        };
        setFilter(filterResolverInput);
        refetchCount(filterResolverInput).catch(console.error);
        setSearchParams(
          convertPropertyFilterQueryToURLSearchParams(
            convertFilterPreferenceToPropertyFilterQuery(filterPreference)
          )
        );
        setQuery(
          convertFilterPreferenceToPropertyFilterQuery(filterPreference)
        );
      }
      setIsInitialLoadComplete(true);
    }

    getPersistedUserPreferences().catch(console.error);
  }, []);
  useEffect((): void => {
    if (searchParams.has('query')) {
      handleQueryUpdate(
        JSON.parse(searchParams.get('query')!) as PropertyFilterQuery
      );
    }
  }, [searchParams]);

  // handlers
  const handleToggleFavorite: (thingName: string) => void = useCallback(
    (thingName: string): void => {
      const updatedFavoriteDevices: Set<string> = new Set(favoriteDevices);
      if (updatedFavoriteDevices.has(thingName)) {
        updatedFavoriteDevices.delete(thingName);
      } else {
        updatedFavoriteDevices.add(thingName);
      }
      setFavoriteDevices(updatedFavoriteDevices);
      const updatedPersistedUserPreferences: PersistedUserPreferences = {
        ...persistedUserPreferences,
        deviceList: {
          ...persistedUserPreferences.deviceList,
          favoriteDevices: Array.from(updatedFavoriteDevices)
        }
      };
      setLocalPersistedUserPreferences(updatedPersistedUserPreferences);
      putPersistedUserPreferences(updatedPersistedUserPreferences).catch(
        console.error
      );
    },
    [favoriteDevices]
  );
  const handleQueryUpdate: (detail: PropertyFilterQuery) => void = (
    detail: PropertyFilterQuery
  ): void => {
    setQuery(detail);
    setSearchParams(convertPropertyFilterQueryToURLSearchParams(detail));
    const matchingSavedQuery: number = (
      persistedUserPreferences.deviceList.filterObjects || []
    )
      .map(convertFilterPreferenceToPropertyFilterQuery)
      .findIndex(
        (query: PropertyFilterQuery): boolean =>
          detail.operation === query.operation &&
          isEmpty(xorWith(detail.tokens, query.tokens, isEqual))
      );
    setSelectedQuery(
      matchingSavedQuery > -1
        ? {
            label:
              persistedUserPreferences.deviceList.filterObjects![
                matchingSavedQuery
              ].name,
            value: String(matchingSavedQuery)
          }
        : null
    );
    const filterResolverInput: FilterResolverInput =
      convertPropertyFilterQueryToFilterResolverInput(
        {
          ...detail
        },
        favoriteDevices
      );
    setFilter(filterResolverInput);
    refetchCount(filterResolverInput).catch(console.error);
  };
  const handleFollow: FollowFunction = useFollow();
  const handleColumnWidthsChange: (
    columnWidthsChangeDetail: NonCancelableCustomEvent<TableProps.ColumnWidthsChangeDetail>
  ) => void = useCallback(
    (
      columnWidthsChangeDetail: NonCancelableCustomEvent<TableProps.ColumnWidthsChangeDetail>
    ): void => {
      const updatedPersistedUserPreferences: PersistedUserPreferences = {
        ...persistedUserPreferences,
        deviceList: {
          ...persistedUserPreferences.deviceList,
          contentDisplay: persistedUserPreferences.deviceList.contentDisplay
            ? persistedUserPreferences.deviceList.contentDisplay?.map(
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
  const handlePageChange: DebouncedFunc<
    (event: NonCancelableCustomEvent<PaginationProps.ChangeDetail>) => void
  > = useCallback(
    debounce(
      ({
        detail
      }: NonCancelableCustomEvent<PaginationProps.ChangeDetail>): void => {
        setCurrentPageIndex(detail.currentPageIndex);
      },
      300
    ),
    []
  );

  const handleQuerySave: () => void = (): void => {
    if (filter?.filters?.length && saveFilterName) {
      const newFilterPreference: FilterPreference = {
        filters:
          filter.filters?.map((filterInput: FilterInput): Filter => {
            return {
              fieldName: filterInput.fieldName,
              operator: filterInput.operator,
              value: filterInput.value
            };
          }) || [],
        operation: filter.operation,
        name: saveFilterName
      };
      const overwriteFilterIndex: number = (
        persistedUserPreferences.deviceList.filterObjects || []
      )?.findIndex(
        (filterPreference: FilterPreference): boolean =>
          filterPreference.name === saveFilterName
      );
      const filterObjects: Array<FilterPreference> =
        persistedUserPreferences.deviceList.filterObjects?.concat(
          newFilterPreference
        ) || [newFilterPreference];
      if (overwriteFilterIndex > -1) {
        filterObjects.splice(overwriteFilterIndex, 1);
      }
      const updatedPersistedUserPreferences: PersistedUserPreferences = {
        ...persistedUserPreferences,
        deviceList: {
          ...persistedUserPreferences.deviceList,
          filterObjects
        }
      };
      setQuerySelectOptions(
        updatedPersistedUserPreferences.deviceList.filterObjects?.map(
          (
            filterPreference: FilterPreference,
            index: number
          ): SelectProps.Option => {
            return {
              label: filterPreference.name,
              value: String(index)
            };
          }
        ) || []
      );
      if (updatedPersistedUserPreferences.deviceList.filterObjects?.length) {
        // select the newly added filter
        setSelectedQuery({
          label: saveFilterName,
          value: (
            updatedPersistedUserPreferences.deviceList.filterObjects.length - 1
          ).toString()
        });
      }
      setLocalPersistedUserPreferences(updatedPersistedUserPreferences);
      putPersistedUserPreferences(updatedPersistedUserPreferences).catch(
        console.error
      );
    }
    setShowSaveQueryDialog(false);
    setSaveFilterName('');
  };
  const handleSelectedSavedQueryChange: (
    event: NonCancelableCustomEvent<SelectProps.ChangeDetail>
  ) => void = (
    event: NonCancelableCustomEvent<SelectProps.ChangeDetail>
  ): void => {
    // HERE
    const newIndex: number = Number(event.detail.selectedOption.value);
    const selectedFilterPreference: FilterPreference | undefined =
      persistedUserPreferences.deviceList.filterObjects?.[newIndex];
    if (selectedFilterPreference) {
      const persistedFavoriteDevices: Array<string> =
        persistedUserPreferences.deviceList.favoriteDevices ?? [];
      setQuery(
        convertFilterPreferenceToPropertyFilterQuery(selectedFilterPreference)
      );
      const filterResolverInput: FilterResolverInput = {
        filters: selectedFilterPreference.filters,
        operation: selectedFilterPreference.operation,
        favoriteDevices: Array.from(persistedFavoriteDevices)
      };
      setFilter(filterResolverInput);
      setSelectedQuery(event.detail.selectedOption);
      setSearchParams(
        convertPropertyFilterQueryToURLSearchParams(
          convertFilterPreferenceToPropertyFilterQuery(selectedFilterPreference)
        )
      );
      refetchCount(filterResolverInput).catch(console.error);
    }
  };
  const handleSavedQueryDelete: () => void = (): void => {
    if (selectedQuery) {
      const updatedPersistedUserPreferences: PersistedUserPreferences = {
        ...persistedUserPreferences,
        deviceList: {
          ...persistedUserPreferences.deviceList,
          filterObjects:
            persistedUserPreferences.deviceList.filterObjects?.filter(
              (filter: FilterPreference): boolean => {
                return selectedQuery?.label !== filter.name;
              }
            ) || []
        }
      };
      setQuerySelectOptions(
        updatedPersistedUserPreferences.deviceList.filterObjects?.map(
          (
            filterPreference: FilterPreference,
            index: number
          ): SelectProps.Option => {
            return {
              label: filterPreference.name,
              value: String(index)
            };
          }
        ) || []
      );
      setSelectedQuery(null);
      setLocalPersistedUserPreferences(updatedPersistedUserPreferences);
      putPersistedUserPreferences(updatedPersistedUserPreferences).catch(
        console.error
      );
    }
  };
  const handlePreferencesChange: NonCancelableEventHandler<CollectionPreferencesProps.Preferences> =
    useCallback(
      (
        event: NonCancelableCustomEvent<CollectionPreferencesProps.Preferences>
      ): void => {
        setIsInitialLoadComplete(false);
        const newPreferences: CollectionPreferencesProps.Preferences =
          event.detail;
        if (newPreferences.pageSize !== localPreferences.pageSize) {
          setCurrentPageIndex(1);
        }
        confirmLocalPreferences(event);
        const updatedPersistedUserPreferences: PersistedUserPreferences = {
          ...persistedUserPreferences,
          deviceList: {
            ...persistedUserPreferences.deviceList,
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
                      persistedUserPreferences.deviceList.contentDisplay
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
              ...updatedPersistedUserPreferences.deviceList
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
  const handleRefresh: () => Promise<void> =
    useCallback(async (): Promise<void> => {
      try {
        await Promise.all([
          memoizedFetchDevices(currentPageIndex),
          refetchCount(filter)
        ]);
      } catch (error: unknown) {
        console.error('Error refreshing data:', error);
      }
    }, [currentPageIndex, memoizedFetchDevices, refetchCount, filter]);

  // table
  const columns: Array<TableProps.ColumnDefinition<ThingSummary>> =
    useMemo((): Array<TableProps.ColumnDefinition<ThingSummary>> => {
      return getDeviceTableColumns({
        formatTimestamp,
        onNavigate: handleFollow,
        contentDisplay:
          persistedUserPreferences.deviceList.contentDisplay || undefined,
        favoriteDevices,
        onToggleFavorite: handleToggleFavorite
      });
    }, [persistedUserPreferences, handleFollow, favoriteDevices]);
  return (
    <div
      style={{
        position: 'relative',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        minHeight: '200px'
      }}
    >
      {isInitialLoadComplete ? (
        <>
          <Modal
            visible={showSaveQueryDialog}
            onDismiss={(): void => {
              setShowSaveQueryDialog(false);
              setSaveFilterName('');
            }}
            footer={
              <Box float="right">
                <SpaceBetween direction="horizontal" size="xs">
                  <Button
                    variant="link"
                    onClick={(): void => {
                      setShowSaveQueryDialog(false);
                      setSaveFilterName('');
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    disabled={!saveFilterName}
                    onClick={handleQuerySave}
                  >
                    {persistedUserPreferences.deviceList.filterObjects?.some(
                      (filter: FilterPreference): boolean =>
                        filter.name === saveFilterName
                    )
                      ? 'Update'
                      : 'Create'}
                  </Button>
                </SpaceBetween>
              </Box>
            }
            header="Store current filters"
          >
            <FormField
              label="Query name"
              description="Enter a name for the query"
            >
              <Autosuggest
                onChange={({
                  detail
                }: NonCancelableCustomEvent<InputProps.ChangeDetail>): void =>
                  setSaveFilterName(detail.value)
                }
                onKeyDown={({
                  detail
                }: CustomEvent<InputProps.KeyDetail>): void => {
                  if (detail.key === 'Enter') {
                    handleQuerySave();
                  }
                }}
                value={saveFilterName}
                options={persistedUserPreferences.deviceList.filterObjects?.map(
                  (filter: FilterPreference): AutosuggestProps.Option => ({
                    value: filter.name
                  })
                )}
                placeholder="Enter name"
              />
            </FormField>
          </Modal>
          <Table<ThingSummary>
            loading={loading}
            items={devices}
            columnDefinitions={columns}
            pagination={
              <Pagination
                currentPageIndex={currentPageIndex}
                pagesCount={Math.max(
                  1,
                  Math.ceil(
                    count / (localPreferences.pageSize || DEFAULT_PAGE_SIZE)
                  )
                )}
                onChange={handlePageChange}
              />
            }
            header={
              <Header
                counter={countError ? '(Error loading count)' : `(${count})`}
                actions={
                  <SpaceBetween size="xs" direction="horizontal">
                    <Button onClick={(): void => void handleRefresh()}>
                      Refresh
                    </Button>
                  </SpaceBetween>
                }
              >
                Devices
              </Header>
            }
            filter={
              <DeviceListFilter
                query={query}
                firmwareTypes={[
                  // TODO: Get firmware types from backend
                  'ap_blwp_v1',
                  'rac_midea_v1',
                  'dhw_midea_v1',
                  'ap_blwp_v2',
                  'aio_blwp_v2',
                  'rrc_blwp_v2',
                  'ws_midea_v2',
                  'pac_blwp_v2'
                ]}
                handleQueryUpdate={handleQueryUpdate}
                customFilterActions={
                  selectedQuery ? (
                    <div
                      ref={(ref: HTMLDivElement): void => {
                        const button: HTMLButtonElement | null | undefined =
                          ref?.children?.item(0) as
                            | HTMLButtonElement
                            | null
                            | undefined;
                        if (button?.tagName === 'BUTTON') {
                          const color: string =
                            window.matchMedia &&
                            window.matchMedia('(prefers-color-scheme: dark)')
                              .matches
                              ? '#ff8787'
                              : '#ed0007';
                          button.style.color = color;
                          button.style.borderColor = color;
                        }
                      }}
                    >
                      <Button onClick={handleSavedQueryDelete}>
                        Delete stored query
                      </Button>
                    </div>
                  ) : (
                    <Button onClick={(): void => setShowSaveQueryDialog(true)}>
                      Store query
                    </Button>
                  )
                }
                customControl={
                  <div
                    ref={(childElement: HTMLDivElement): void => {
                      if (childElement?.parentElement?.parentElement) {
                        childElement.parentElement.parentElement.style.flexDirection =
                          'row-reverse';
                        childElement.parentElement.parentElement.style.justifyContent =
                          'flex-end';
                        childElement.parentElement.parentElement.style.alignItems =
                          'flex-start';
                      }
                    }}
                  >
                    <Select
                      selectedOption={selectedQuery}
                      options={querySelectOptions}
                      empty="No queries stored"
                      placeholder="Select a stored query"
                      onChange={handleSelectedSavedQueryChange}
                    />
                  </div>
                }
              />
            }
            preferences={
              <CollectionPreferences
                title="Preferences"
                confirmLabel="Confirm"
                cancelLabel="Cancel"
                preferences={localPreferences}
                pageSizePreference={{
                  title: 'Page size',
                  options: [
                    { value: 10, label: '10 Devices' },
                    { value: 20, label: '20 Devices' },
                    { value: 50, label: '50 Devices' },
                    { value: 100, label: '100 Devices' }
                  ]
                }}
                contentDisplayPreference={{
                  title: 'Select visible columns and their order',
                  options: [
                    { id: 'favorite', label: 'Favorite' },
                    { id: 'thingName', label: 'Serial Number' },
                    { id: 'deviceType', label: 'Device Type' },
                    { id: 'disconnectReason', label: 'Disconnect Reason' },
                    { id: 'lastConnectedAt', label: 'Last Connected' },
                    { id: 'connected', label: 'Connection Status' },
                    {
                      id: 'provisioningTimestamp',
                      label: 'Provisioning Timestamp'
                    },
                    {
                      id: 'productionTimestamp',
                      label: 'Production Timestamp'
                    },
                    { id: 'brandName', label: 'Brand' },
                    { id: 'country', label: 'Country' },
                    {
                      id: 'hasApplianceFW',
                      label: 'Has Appliance Firmware'
                    },
                    { id: 'firmwareType', label: 'Firmware Type' },
                    { id: 'firmwareVersion', label: 'Firmware Version' },
                    { id: 'thingGroupNames', label: 'Thing Groups' }
                  ]
                }}
                onConfirm={handlePreferencesChange}
              />
            }
            variant="container"
            stickyHeader
            resizableColumns
            onColumnWidthsChange={handleColumnWidthsChange}
            wrapLines={localPreferences.wrapLines}
            stripedRows={localPreferences.stripedRows}
            contentDensity={localPreferences.contentDensity}
            stickyColumns={localPreferences.stickyColumns}
            columnDisplay={localPreferences.visibleContent?.map(
              (id: string): TableProps.ColumnDisplayProperties => ({
                id,
                visible: true
              })
            )}
            empty={
              <Box
                margin={{ vertical: 'xs' }}
                textAlign="center"
                color="inherit"
              >
                <SpaceBetween size="m">
                  <b>No Devices</b>
                </SpaceBetween>
              </Box>
            }
          />
        </>
      ) : (
        <div style={{ textAlign: 'center' }}>
          <Spinner />
        </div>
      )}
    </div>
  );
};
