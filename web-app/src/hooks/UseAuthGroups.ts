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
