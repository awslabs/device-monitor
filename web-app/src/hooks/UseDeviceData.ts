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

import { useState, useCallback, useEffect } from 'react';
import { client } from '../config/appsync-config';
import {
  ListThingsDocument,
  type ListThingsQuery,
  type ListThingsQueryVariables,
  type ThingSummary,
  type FilterResolverInput
} from '@bfw/shared/src/appsync';

import { useThingsCount, type UseThingCountHook } from './UseThingsCount';
import type {
  GenericReactState,
  ReactEffectDestructor
} from '@bfw/shared/src/types';
import type { GraphQLResult } from '@aws-amplify/api-graphql';
import type { AmplifyQuery } from '../utils/AmplifyQuery';

export interface UseDeviceDataReturn {
  devices: Array<ThingSummary>;
  loading: boolean;
  hasMore: boolean;
  error: string | null;
  fetchDevices: (
    source: string,
    page: number,
    token: string | null,
    filter: FilterResolverInput | null,
    signal?: AbortSignal
  ) => Promise<void>;
  loadMore: () => void;
  nextToken: string | null;
  tokenMap: Record<number, string | null>;
  totalItems: number;
}

export interface UseDeviceDataProps {
  pageSize: number;
  offset: number;
  filter: FilterResolverInput | null;
  currentPage: number;
}

export function useDeviceData({
  pageSize,
  filter,
  currentPage
}: UseDeviceDataProps): UseDeviceDataReturn {
  const [devices, setDevices]: GenericReactState<Array<ThingSummary>> =
    useState<Array<ThingSummary>>([]);
  const [loading, setLoading]: GenericReactState<boolean> = useState(false);
  const [nextToken, setNextToken]: GenericReactState<string | null> = useState<
    string | null
  >(null);
  const [hasMore, setHasMore]: GenericReactState<boolean> = useState(true);
  const [error, setError]: GenericReactState<string | null> = useState<
    string | null
  >(null);
  const [tokenMap, setTokenMap]: GenericReactState<
    Record<number, string | null>
  > = useState<Record<number, string | null>>({});

  // Use the existing hook for total count
  const { count: totalItems }: UseThingCountHook = useThingsCount({
    filter
  });

  const fetchDevices: (
    source: string,
    page: number,
    token: string | null,
    filter: FilterResolverInput | null,
    signal?: AbortSignal
  ) => Promise<void> = useCallback(
    async (
      source: string,
      page: number,
      token: string | null = null,
      filter: FilterResolverInput | null,
      signal?: AbortSignal
    ): Promise<void> => {
      console.log(
        `fetchDevices called with page ${page}, token:`,
        token,
        'pageSize:',
        pageSize,
        'filter:',
        filter,
        'source:',
        source
      );

      if (signal?.aborted) return;

      try {
        setLoading(true);
        setError(null);
        // Calculate if this is the last page
        const isLastPage: boolean = page === Math.ceil(totalItems / pageSize);
        // Calculate remaining items for last page
        const remainingItems: number = isLastPage
          ? totalItems % pageSize
          : pageSize;
        // Use appropriate limit based on whether it's the last page
        const effectiveLimit: number = isLastPage ? remainingItems : pageSize;

        console.log(
          `Page ${page}: Using limit ${effectiveLimit}, total items: ${totalItems}`
        );

        const response: GraphQLResult<ListThingsQuery> = await client.graphql<
          AmplifyQuery<ListThingsQueryVariables, ListThingsQuery>
        >({
          query: ListThingsDocument,
          variables: {
            limit: effectiveLimit,
            nextToken: page === 1 ? null : token,
            filter
          }
        });

        if (signal?.aborted) return;

        if (!response?.data?.listThings) {
          throw new Error('Invalid response structure');
        }

        const newDevices: Array<ThingSummary> =
          response.data.listThings.items || [];
        const newNextToken: string | null = response.data.listThings.nextToken;

        console.log(
          `Received ${newDevices.length} devices with new token:`,
          newNextToken,
          response
        );

        // Update token map for the next page
        setTokenMap(
          (
            prev: Record<number, string | null>
          ): Record<number, string | null> => ({
            ...prev,
            [page]: newNextToken
          })
        );

        setDevices(newDevices);
        setNextToken(newNextToken || null);
        setHasMore(!!newNextToken && !isLastPage);
      } catch (error: unknown) {
        if (signal?.aborted) {
          console.log('Request was aborted');
          return;
        }
        console.error('Error fetching devices:', error);
        setError(error instanceof Error ? error.message : 'Unknown error');
      } finally {
        if (!signal?.aborted) {
          setLoading(false);
        }
      }
    },
    [pageSize, totalItems]
  );

  const loadMore: () => void = useCallback((): void => {
    if (!loading && hasMore) {
      const nextPage: number = currentPage + 1;
      const token: string | null = tokenMap[currentPage];
      console.log(`LoadMore: Loading page ${nextPage} with token:`, token);
      console.log('fetchDevices from LoadMore', filter);
      fetchDevices('loadMore', nextPage, token, filter, undefined).catch(
        setError
      );
    }
  }, [currentPage, loading, hasMore, fetchDevices]);

  useEffect((): ReactEffectDestructor => {
    console.log('useDeviceData effect running with:', {
      pageSize,
      currentPage
    });

    const controller: AbortController = new AbortController();
    console.log('fetchDevices from UseEffect', pageSize, filter);

    const previousPageToken: string | null =
      currentPage > 1 ? tokenMap[currentPage - 1] : null;
    fetchDevices(
      'filterChange',
      currentPage,
      previousPageToken,
      filter,
      controller.signal
    ).catch(setError);

    return (): void => {
      controller.abort();
    };
  }, [pageSize, filter, currentPage, fetchDevices]);

  return {
    devices,
    loading,
    hasMore,
    error,
    fetchDevices,
    loadMore,
    nextToken,
    tokenMap,
    totalItems
  };
}
