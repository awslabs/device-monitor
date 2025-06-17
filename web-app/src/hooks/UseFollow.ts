import type { LinkProps } from '@cloudscape-design/components/link';
import { useCallback } from 'react';
import { useNavigate, type NavigateFunction } from 'react-router-dom';

type NavigationEvent = CustomEvent<Partial<LinkProps.FollowDetail>>;

export type FollowFunction = (event: NavigationEvent, href?: string) => void;

export function useFollow(): FollowFunction {
  const navigate: NavigateFunction = useNavigate();

  const handleFollow: FollowFunction = useCallback(
    (event: NavigationEvent, href?: string): void => {
      href = href || event?.detail?.href;
      if (href) {
        event.preventDefault();
        navigate(href)?.catch(console.error);
      }
    },
    [navigate]
  );

  return handleFollow;
}
