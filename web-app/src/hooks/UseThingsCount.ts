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

import { useState, useEffect, useCallback } from 'react';
import type { GraphQLResult } from '@aws-amplify/api-graphql';
import { client } from '../config/appsync-config';

import {
  type GetThingCountQuery,
  type GetThingCountQueryVariables,
  GetThingCountDocument,
  type FilterResolverInput
} from '@bfw/shared/src/appsync';
import type {
  GenericReactState,
  ReactEffectDestructor
} from '@bfw/shared/src/types';
import type { AmplifyQuery } from '../utils/AmplifyQuery';

export interface UseThingCountHook {
  count: number;
  loading: boolean;
  error: Error | null;
  refetch: (filter: FilterResolverInput | null) => Promise<void>;
}

export interface UseThingsCountProps {
  filter: FilterResolverInput | null;
}

export function useThingsCount({
  filter
}: UseThingsCountProps): UseThingCountHook {
  const [count, setCount]: GenericReactState<number> = useState(0);
  const [loading, setLoading]: GenericReactState<boolean> = useState(false);
  const [error, setError]: GenericReactState<Error | null> =
    useState<Error | null>(null);
  const fetchCount: (filter: FilterResolverInput | null) => Promise<void> =
    useCallback(async (filter: FilterResolverInput | null): Promise<void> => {
      try {
        setLoading(true);
        setError(null);
        const response: GraphQLResult<GetThingCountQuery> =
          await client.graphql<
            AmplifyQuery<GetThingCountQueryVariables, GetThingCountQuery>
          >({
            query: GetThingCountDocument,
            variables: {
              filter
            }
          });
        if (response.errors) {
          console.warn('GraphQL Errors:', response.errors);
          throw new Error(response.errors[0]?.message || 'GraphQL Error');
        }
        if (response.data?.getThingCount !== undefined) {
          setCount(response.data.getThingCount);
        } else {
          console.warn('No count data received');
          setCount(0);
        }
      } catch (error: unknown) {
        console.error('Error in fetchCount:', error);
        setError(error instanceof Error ? error : new Error('Unknown error'));
        setCount(0); // Set a default value on error
      } finally {
        setLoading(false);
      }
    }, []);

  useEffect((): ReactEffectDestructor => {
    let mounted: boolean = true;

    async function doFetch(): Promise<void> {
      if (!mounted) return;
      await fetchCount(filter);
    }

    doFetch().catch(setError);
    return (): void => {
      mounted = false;
    };
  }, [fetchCount, filter]);

  return {
    count,
    loading,
    error,
    refetch: fetchCount
  };
}
