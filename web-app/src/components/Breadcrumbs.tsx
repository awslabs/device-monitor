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

import { type FunctionComponent, type ReactElement } from 'react';
import { useLocation, type Location } from 'react-router-dom';
import { useFollow, type FollowFunction } from '../hooks/UseFollow';
import type { BreadcrumbGroupProps } from '@cloudscape-design/components/breadcrumb-group';
import BreadcrumbGroup from '@cloudscape-design/components/breadcrumb-group';

export const Breadcrumbs: FunctionComponent = (): ReactElement => {
  const handleFollow: FollowFunction = useFollow();
  const location: Location = useLocation();

  function getBreadcrumbs(): Array<BreadcrumbGroupProps.Item> {
    const basePath: BreadcrumbGroupProps.Item = {
      text: 'FleetWatch',
      href: '/'
    };

    switch (location.pathname) {
      case '/':
        return [basePath];
      case '/devices':
        return [basePath, { text: 'Devices', href: '/devices' }];
      case '/jobs':
        return [basePath, { text: 'Firmware Updates', href: '/jobs' }];
      case '/groups':
        return [basePath, { text: 'Device Groups', href: '/groups' }];
      default:
        if (location.pathname.startsWith('/jobs/')) {
          return [
            basePath,
            { text: 'Firmware Updates', href: '/jobs' },
            {
              text: location.pathname.split('/').slice(-1)[0],
              href: location.pathname
            }
          ];
        } else if (location.pathname.startsWith('/devices/')) {
          return [
            basePath,
            { text: 'Devices', href: '/devices' },
            {
              text: location.pathname.split('/').slice(-1)[0],
              href: location.pathname
            }
          ];
        }
        return [basePath];
    }
  }

  return <BreadcrumbGroup items={getBreadcrumbs()} onFollow={handleFollow} />;
};
