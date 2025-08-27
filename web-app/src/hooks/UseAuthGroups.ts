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

import type { GenericReactState } from '@bfw/shared/src/types';
import { fetchAuthSession, type AuthSession } from 'aws-amplify/auth';
import { useEffect, useRef, useState, type MutableRefObject } from 'react';

export interface UseAuthGroups {
  loading: boolean;
  groups: Array<string>;
}

export function useAuthGroups(): UseAuthGroups {
  const [groups, setGroups]: GenericReactState<Array<string>> = useState<
    Array<string>
  >([]);
  const [loading, setLoading]: GenericReactState<boolean> =
    useState<boolean>(true);
  const hasFetched: MutableRefObject<boolean> = useRef(false);

  useEffect((): void => {
    async function fetchGroups(): Promise<void> {
      if (!hasFetched.current) {
        hasFetched.current = true;
        try {
          const session: AuthSession = await fetchAuthSession();
          setGroups(
            (session.tokens?.accessToken?.payload?.[
              'cognito:groups'
            ] as Array<string>) || []
          );
        } finally {
          setLoading(false);
        }
      }
    }
    fetchGroups().catch(console.error);
  }, []);

  return { loading, groups: groups || [] };
}
