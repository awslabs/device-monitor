/**
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import {
  GetPersistedUserPreferencesDocument,
  type GetPersistedUserPreferencesQuery,
  type GetPersistedUserPreferencesQueryVariables,
  PutPersistedUserPreferencesDocument,
  type PutPersistedUserPreferencesMutation,
  type PutPersistedUserPreferencesMutationVariables,
  type PersistedUserPreferences
} from '@bfw/shared/src/appsync';
import {
  type Dispatch,
  type SetStateAction,
  useCallback,
  useState
} from 'react';
import type { GraphQLResult } from 'aws-amplify/api';
import { client } from '../config/appsync-config';
import type { GenericReactState } from '@bfw/shared/src/types';
import { DEFAULT_PAGE_SIZE } from './UseLocalDeviceListPreferences';
import type { AmplifyQuery } from '../utils/AmplifyQuery';

const defaultUserPreferences: PersistedUserPreferences = {
  deviceList: {
    favoriteDevices: [],
    pageSize: DEFAULT_PAGE_SIZE,
    visibleContent: [
      'favorite',
      'thingName',
      'connected',
      'lastConnectedAt',
      'deviceType',
      'disconnectReason'
    ],
    wrapLines: true,
    stripedRows: true,
    contentDensity: 'comfortable',
    stickyColumns: { first: 0, last: 0 },
    contentDisplay: [
      { id: 'favorite', visible: true, width: 50 },
      { id: 'thingName', visible: true, width: 200 },
      { id: 'deviceType', visible: true, width: 200 },
      { id: 'disconnectReason', visible: true, width: 200 },
      { id: 'connected', visible: true, width: 200 },
      { id: 'hasApplianceFW', visible: false, width: 200 },
      { id: 'lastConnectedAt', visible: true, width: 200 },
      { id: 'provisioningTimestamp', visible: false, width: 200 },
      { id: 'productionTimestamp', visible: false, width: 200 },
      { id: 'brandName', visible: false, width: 200 },
      { id: 'country', visible: false, width: 200 },
      { id: 'firmwareType', visible: false, width: 200 },
      { id: 'firmwareVersion', visible: false, width: 200 },
      { id: 'thingGroupNames', visible: false, width: 200 }
    ],
    filterObjects: null
  },
  jobList: {
    pageSize: 20,
    visibleContent: [
      'jobId',
      'status',
      'createdAt',
      'lastUpdatedAt',
      'completedAt'
    ],
    wrapLines: true,
    stripedRows: true,
    contentDensity: 'comfortable',
    stickyColumns: { first: 0, last: 0 },
    contentDisplay: [
      { id: 'jobId', visible: true, width: 200 },
      { id: 'status', visible: true, width: 200 },
      { id: 'createdAt', visible: true, width: 200 },
      { id: 'lastUpdatedAt', visible: true, width: 200 },
      { id: 'completedAt', visible: true, width: 200 }
    ]
  }
};

export interface UsePersistedUserPreferencesHook {
  putPersistedUserPreferences: (
    persistedUserPreferences: PersistedUserPreferences
  ) => Promise<void>;
  persistedUserPreferences: PersistedUserPreferences;
  refreshPersistedUserPreferences: () => Promise<PersistedUserPreferences>;
  setLocalPersistedUserPreferences: Dispatch<
    SetStateAction<PersistedUserPreferences>
  >;
}

export function usePersistedUserPreferences(): UsePersistedUserPreferencesHook {
  const [
    persistedUserPreferences,
    setPersistedUserPreferences
  ]: GenericReactState<PersistedUserPreferences> =
    useState<PersistedUserPreferences>(defaultUserPreferences);
  const refreshPersistedUserPreferences: () => Promise<PersistedUserPreferences> =
    useCallback(
      async (signal?: AbortSignal): Promise<PersistedUserPreferences> => {
        if (signal?.aborted) return defaultUserPreferences;
        try {
          const response: GraphQLResult<GetPersistedUserPreferencesQuery> =
            await client.graphql<
              AmplifyQuery<
                GetPersistedUserPreferencesQueryVariables,
                GetPersistedUserPreferencesQuery
              >
            >({
              query: GetPersistedUserPreferencesDocument
            });
          const persistedUserPreferences: PersistedUserPreferences = response
            .data.getPersistedUserPreferences
            ? response.data.getPersistedUserPreferences
            : defaultUserPreferences;
          setPersistedUserPreferences(persistedUserPreferences);
          return persistedUserPreferences;
        } catch (error) {
          if (signal?.aborted) {
            console.log('Request was aborted');
          }
          console.error('Error fetching userPreferences:', error);
          return defaultUserPreferences;
        }
      },
      []
    );
  const putPersistedUserPreferences: (
    persistedUserPreferences: PersistedUserPreferences
  ) => Promise<void> = useCallback(
    async (
      persistedUserPreferences: PersistedUserPreferences,
      signal?: AbortSignal
    ): Promise<void> => {
      if (signal?.aborted) return;
      try {
        await client.graphql<
          AmplifyQuery<
            PutPersistedUserPreferencesMutationVariables,
            PutPersistedUserPreferencesMutation
          >
        >({
          query: PutPersistedUserPreferencesDocument,
          variables: {
            input: persistedUserPreferences
          }
        });
      } catch (error) {
        if (signal?.aborted) {
          console.log('Request was aborted');
          return;
        }
        console.error('Error putting userPreferences:', error);
      }
    },
    []
  );
  return {
    putPersistedUserPreferences: putPersistedUserPreferences,
    persistedUserPreferences: persistedUserPreferences,
    refreshPersistedUserPreferences: refreshPersistedUserPreferences,
    setLocalPersistedUserPreferences: setPersistedUserPreferences
  };
}
