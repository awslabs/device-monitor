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
