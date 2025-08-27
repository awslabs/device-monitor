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
import { client } from '../config/appsync-config';
import {
  ListThingGroupsDocument,
  type ListThingGroupsQuery,
  type ListThingGroupsQueryVariables,
  type ThingGroup
} from '@bfw/shared/src/appsync';
import type { GraphQLResult } from '@aws-amplify/api-graphql';
import type { TableProps } from '@cloudscape-design/components/table';
import Box from '@cloudscape-design/components/box';
import Container from '@cloudscape-design/components/container';
import SpaceBetween from '@cloudscape-design/components/space-between';
import Spinner from '@cloudscape-design/components/spinner';
import TextFilter, {
  type TextFilterProps
} from '@cloudscape-design/components/text-filter';
import Table from '@cloudscape-design/components/table';
import type { GenericReactState } from '@bfw/shared/src/types';
import type { NonCancelableCustomEvent } from '@cloudscape-design/components/interfaces';
import type { AmplifyQuery } from '../utils/AmplifyQuery';

type SortingState = TableProps.SortingState<TableItem>;

interface TableItem {
  id: string;
  name: string;
  type: 'group' | 'device';
  children?: Array<TableItem>;
  loading?: boolean;
  finished?: boolean;
  error?: boolean;
  groupName?: string;
  groupType?: 'STATIC' | 'DYNAMIC';
}

function filterItems(
  items: Array<TableItem>,
  searchText: string
): Array<TableItem> {
  if (!searchText) return items;

  return items
    .map((item: TableItem): TableItem | null => {
      // Create a copy of the item
      const filteredItem: TableItem = { ...item };
      // Check if the current item matches the search
      const nameMatches: boolean = item.name
        .toLowerCase()
        .includes(searchText.toLowerCase());

      // If the item has children, filter them recursively
      if (item.children && item.children.length > 0) {
        filteredItem.children = filterItems(item.children, searchText);
      }

      // Keep the item if it matches or has matching children
      if (
        nameMatches ||
        (filteredItem.children && filteredItem.children.length > 0)
      ) {
        return filteredItem;
      }

      return null;
    })
    .filter((item: TableItem | null): item is TableItem => item !== null);
}

const columnDefinitions: Array<TableProps.ColumnDefinition<TableItem>> = [
  {
    id: 'name',
    header: 'Name',
    cell: (item: TableItem): ReactElement => (
      <Box>
        {item.loading ? (
          <SpaceBetween direction="horizontal" size="xs">
            <Spinner />
            {item.name}
          </SpaceBetween>
        ) : (
          item.name
        )}
      </Box>
    ),
    sortingField: 'name'
  },
  {
    id: 'type',
    header: 'Type',
    cell: (item: TableItem): ReactElement => (
      <Box
        color={
          item.type === 'device' ? 'text-status-success' : 'text-status-info'
        }
      >
        {item.type}
      </Box>
    ),
    sortingField: 'type'
  },
  {
    id: 'groupType',
    header: 'Group Type',
    cell: (item: TableItem): ReactElement => (
      <Box
        color={
          item.type === 'group'
            ? item.groupType === 'DYNAMIC'
              ? 'text-status-warning'
              : 'text-status-info'
            : undefined
        }
      >
        {item.type === 'group' ? item.groupType : '-'}
      </Box>
    ),
    sortingField: 'groupType'
  }
];

export const DeviceGroupsList: FunctionComponent = (): ReactElement => {
  const [loading, setLoading]: GenericReactState<boolean> = useState(true);
  const [error, setError]: GenericReactState<string | null> = useState<
    string | null
  >(null);
  const [items, setItems]: GenericReactState<Array<TableItem>> = useState<
    Array<TableItem>
  >([]);
  const [expandedItems, setExpandedItems]: GenericReactState<Array<TableItem>> =
    useState<Array<TableItem>>([]);
  const [filterText, setFilterText]: GenericReactState<string> = useState('');
  const [sortingState, setSortingState]: GenericReactState<SortingState> =
    useState<SortingState>({
      sortingColumn: columnDefinitions[0],
      isDescending: false
    });

  // const sortedItems = [...filterItems(items, filterText)].sort((a, b) => {
  //   const { sortingColumn, isDescending } = sortingState;

  //   if (!sortingColumn || !sortingColumn.sortingField) return 0;

  //   const field = sortingColumn.sortingField as keyof TableItem;
  //   const aValue = a[field];
  //   const bValue = b[field];

  //   if (typeof aValue === 'string' && typeof bValue === 'string') {
  //     return isDescending
  //       ? bValue.localeCompare(aValue)
  //       : aValue.localeCompare(bValue);
  //   }

  //   return 0;
  // });

  async function fetchThingGroups(): Promise<Array<ThingGroup>> {
    try {
      const response: GraphQLResult<ListThingGroupsQuery> =
        await client.graphql<
          AmplifyQuery<ListThingGroupsQueryVariables, ListThingGroupsQuery>
        >({
          query: ListThingGroupsDocument
        });
      return (
        (response.data?.listThingGroups?.groups as Array<ThingGroup>)?.filter(
          (group: ThingGroup | null): group is ThingGroup =>
            group !== null &&
            typeof group.groupName === 'string' &&
            typeof group.groupType === 'string'
        ) ?? []
      );
    } catch (err) {
      console.error('Error fetching thing groups:', err);
      throw err;
    }
  }

  function buildGroupHierarchy(groups: Array<ThingGroup>): Array<TableItem> {
    const groupMap: Map<string, TableItem> = new Map<string, TableItem>();

    // Helper function to create or get a TableItem for a group
    function getOrCreateTableItem(group: ThingGroup): TableItem {
      let item: TableItem | undefined = groupMap.get(group.groupName);
      if (!item) {
        item = {
          id: group.groupName,
          name: group.groupName,
          type: 'group',
          groupName: group.groupName,
          groupType: group.groupType as 'STATIC' | 'DYNAMIC',
          children: []
        };
        groupMap.set(group.groupName, item);
      }
      return item;
    }

    // Process all groups and their children recursively
    function processGroup(group: ThingGroup): TableItem {
      const tableItem: TableItem = getOrCreateTableItem(group);

      if (group.childGroups && group.childGroups.length > 0) {
        tableItem.children = group.childGroups
          .filter(
            (childGroup: ThingGroup | null): childGroup is ThingGroup =>
              childGroup !== null && typeof childGroup.groupName === 'string'
          )
          .map((childGroup: ThingGroup): TableItem => processGroup(childGroup));
      }

      return tableItem;
    }

    // Process root groups
    const rootItems: Array<TableItem> = groups.map(
      (group: ThingGroup): TableItem => processGroup(group)
    );

    // Find all child group names to filter out non-root groups
    const allChildGroupNames: Set<string> = new Set(
      groups
        .flatMap(
          (group: ThingGroup): Array<ThingGroup> => group.childGroups ?? []
        )
        .map((group: ThingGroup): string | undefined => group?.groupName)
        .filter(
          (name: string | undefined): name is string => name !== undefined
        )
    );

    // Return only root groups
    return rootItems.filter(
      (item: TableItem): item is TableItem =>
        item.groupName !== undefined && !allChildGroupNames.has(item.groupName)
    );
  }

  function handleExpandRow(item: TableItem, expanded: boolean): void {
    if (expanded) {
      console.log(`Expanding group: ${item.groupName}`);

      // Ensure group is marked as expanded first
      setExpandedItems(
        (prev: Array<TableItem>): Array<TableItem> => [...prev, item]
      );

      // Set loading state for the item
      setItems((currentItems: Array<TableItem>): Array<TableItem> => {
        function updateItemInTree(items: Array<TableItem>): Array<TableItem> {
          return items.map((i: TableItem): TableItem => {
            if (i.id === item.id) {
              return { ...i, loading: true }; // Show spinner
            }
            if (i.children) {
              return { ...i, children: updateItemInTree(i.children) };
            }
            return i;
          });
        }
        return updateItemInTree(currentItems);
      });

      try {
        if (item.type === 'group' && item.groupName) {
          // Check if the group has child groups
          const hasChildGroups: boolean | undefined = item.children?.some(
            (child: TableItem): boolean => child.type === 'group'
          );

          if (hasChildGroups) {
            // If there are child groups, just show them by removing the loading state
            setItems((currentItems: Array<TableItem>): Array<TableItem> => {
              function updateItemInTree(
                items: Array<TableItem>
              ): Array<TableItem> {
                return items.map((i: TableItem): TableItem => {
                  if (i.id === item.id) {
                    return {
                      ...i,
                      loading: false,
                      finished: true,
                      children: i.children || []
                    };
                  }
                  if (i.children) {
                    return { ...i, children: updateItemInTree(i.children) };
                  }
                  return i;
                });
              }
              return updateItemInTree(currentItems);
            });
          } else {
            // If no child groups, open DeviceList in new window
            window.open(
              `/devices?query={"tokens"%3A[{"propertyKey"%3A"thingGroupNames"%2C"operator"%3A"%3D"%2C"value"%3A"${encodeURIComponent(item.groupName)}"}]%2C"operation"%3A"and"}`,
              '_blank'
            );

            // Mark as finished and remove from expandedItems to collapse the node
            setItems((currentItems: Array<TableItem>): Array<TableItem> => {
              function updateItemInTree(
                items: Array<TableItem>
              ): Array<TableItem> {
                return items.map((i: TableItem): TableItem => {
                  if (i.id === item.id) {
                    return {
                      ...i,
                      loading: false,
                      finished: true,
                      children: []
                    };
                  }
                  if (i.children) {
                    return { ...i, children: updateItemInTree(i.children) };
                  }
                  return i;
                });
              }
              return updateItemInTree(currentItems);
            });

            // Remove the item from expandedItems to collapse it
            setExpandedItems(
              (prev: Array<TableItem>): Array<TableItem> =>
                prev.filter((i: TableItem): boolean => i.id !== item.id)
            );
          }
        }
      } catch (err) {
        console.error('Error:', err);
        // Set error state on failure
        setItems((currentItems: Array<TableItem>): Array<TableItem> => {
          function updateItemInTree(items: Array<TableItem>): Array<TableItem> {
            return items.map((i: TableItem): TableItem => {
              if (i.id === item.id) {
                return { ...i, loading: false, error: true };
              }
              if (i.children) {
                return { ...i, children: updateItemInTree(i.children) };
              }
              return i;
            });
          }
          return updateItemInTree(currentItems);
        });
      }
    } else {
      // Collapse item if it's being closed
      setExpandedItems(
        (prev: Array<TableItem>): Array<TableItem> =>
          prev.filter((i: TableItem): boolean => i.id !== item.id)
      );
    }
  }

  useEffect((): void => {
    async function loadGroups(): Promise<void> {
      try {
        setLoading(true);
        const groups: Array<ThingGroup> = await fetchThingGroups();
        setItems(buildGroupHierarchy(groups));
      } catch {
        setError('Failed to load hierarchy data');
      } finally {
        setLoading(false);
      }
    }
    loadGroups().catch(console.error);
  }, []);

  return loading ? (
    <Spinner />
  ) : error ? (
    <Box color="text-status-error">{error}</Box>
  ) : (
    <Container>
      <SpaceBetween size="m">
        <TextFilter
          filteringText={filterText}
          onChange={({
            detail
          }: NonCancelableCustomEvent<TextFilterProps.ChangeDetail>): void =>
            setFilterText(detail.filteringText)
          }
          countText={`${items.length} matches`}
          filteringPlaceholder="Find groups or devices"
        />
        <Table<TableItem>
          columnDefinitions={columnDefinitions}
          items={[...filterItems(items, filterText)].sort(
            (a: TableItem, b: TableItem): number => {
              const { sortingColumn, isDescending }: SortingState =
                sortingState;

              if (!sortingColumn || !sortingColumn.sortingField) return 0;

              const field: keyof TableItem =
                sortingColumn.sortingField as keyof TableItem;
              const aValue: unknown = a[field];
              const bValue: unknown = b[field];

              if (typeof aValue === 'string' && typeof bValue === 'string') {
                return isDescending
                  ? bValue.localeCompare(aValue)
                  : aValue.localeCompare(bValue);
              }
              return 0;
            }
          )}
          trackBy="id"
          sortingColumn={sortingState.sortingColumn}
          sortingDescending={sortingState.isDescending}
          onSortingChange={({
            detail
          }: NonCancelableCustomEvent<
            TableProps.SortingState<TableItem>
          >): void => {
            setSortingState({
              sortingColumn: detail.sortingColumn,
              isDescending: detail.isDescending
            });
          }}
          expandableRows={{
            getItemChildren: (item: TableItem): Array<TableItem> =>
              item.children || [],
            isItemExpandable: (item: TableItem): boolean =>
              item.type === 'group',
            expandedItems,
            onExpandableItemToggle: ({
              detail
            }: NonCancelableCustomEvent<
              TableProps.ExpandableItemToggleDetail<TableItem>
            >): void => {
              setExpandedItems(
                detail.expanded
                  ? [...expandedItems, detail.item]
                  : expandedItems.filter(
                      (i: TableItem): boolean => i.id !== detail.item.id
                    )
              );
              handleExpandRow(detail.item, detail.expanded);
            }
          }}
        />
      </SpaceBetween>
    </Container>
  );
};
