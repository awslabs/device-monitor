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

import type React from 'react';
import { type ReactElement } from 'react';
import type { FollowFunction } from '../hooks/UseFollow';
import type { ContentDisplay, ThingSummary } from '@bfw/shared/src/appsync';
import type { TableProps } from '@cloudscape-design/components/table';
import Icon from '@cloudscape-design/components/icon';
import Link from '@cloudscape-design/components/link';
import StatusIndicator from '@cloudscape-design/components/status-indicator';
import Box from '@cloudscape-design/components/box';
import Badge from '@cloudscape-design/components/badge';
import { uniq } from 'lodash';

export interface TableColumnConfig {
  formatTimestamp: (timestamp: number | undefined) => string;
  onNavigate: FollowFunction;
  favoriteDevices?: Set<string>;
  onToggleFavorite?: (thingName: string) => void;
  contentDisplay?: Array<ContentDisplay>;
}

const findWidthInContentDisplay: (
  targetColumnName: string,
  config: TableColumnConfig
) => number = (targetColumnName: string, config: TableColumnConfig): number => {
  const defaultWidth: number = 200;
  if (!config.contentDisplay) {
    return defaultWidth;
  } else {
    const width: number | null | undefined = config.contentDisplay.find(
      (content: ContentDisplay): boolean =>
        !content ? false : content.id === targetColumnName
    )?.width;
    return width ? width : defaultWidth;
  }
};

export function getDeviceTableColumns(
  config: TableColumnConfig
): Array<TableProps.ColumnDefinition<ThingSummary>> {
  return [
    {
      id: 'favorite',
      header: '',
      cell: (item: ThingSummary): ReactElement => {
        const isFavorite: boolean =
          config.favoriteDevices?.has(item.thingName) ?? false;
        return (
          <span
            onClick={(e: React.MouseEvent): void => {
              e.stopPropagation();
              config.onToggleFavorite?.(item.thingName);
            }}
            style={{ cursor: 'pointer' }}
            aria-label={
              isFavorite ? 'Remove from favorites' : 'Add to favorites'
            }
            title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            <Icon
              name={isFavorite ? 'star-filled' : 'star'}
              size="normal"
              variant={isFavorite ? 'error' : 'subtle'}
            />
          </span>
        );
      },
      minWidth: 0,
      width: findWidthInContentDisplay('favorite', config),
      sortingField: 'favorite',
      sortingComparator: (a: ThingSummary, b: ThingSummary): number => {
        const aFavorite: boolean =
          config.favoriteDevices?.has(a.thingName) ?? false;
        const bFavorite: boolean =
          config.favoriteDevices?.has(b.thingName) ?? false;
        return Number(bFavorite) - Number(aFavorite);
      }
    },
    {
      id: 'thingName',
      header: 'Thing Name',
      cell: (item: ThingSummary): ReactElement => (
        <Link
          href={`/devices/${item.thingName}`}
          onFollow={config.onNavigate}
          variant="primary"
        >
          {item.thingName}
        </Link>
      ),
      sortingField: 'thingName',
      width: findWidthInContentDisplay('thingName', config)
    },
    {
      id: 'deviceType',
      header: 'Device Type',
      cell: (item: ThingSummary): string => item.deviceType || '-',
      sortingField: 'deviceType',
      minWidth: 50,
      width: findWidthInContentDisplay('deviceType', config)
    },
    {
      id: 'disconnectReason',
      header: 'Disconnect Reason',
      cell: (item: ThingSummary): string => item.disconnectReason || '-',
      sortingField: 'disconnectReason',
      minWidth: 50,
      width: findWidthInContentDisplay('disconnectReason', config)
    },
    {
      id: 'connected',
      header: 'Status',
      cell: (item: ThingSummary): ReactElement => {
        // Handle connection status explicitly
        // Convert to boolean and log for debugging
        const rawValue = item.connected;
        const isConnected = rawValue === true || rawValue === 'true';
        console.log(`DeviceList - Item ${item.thingName} - Raw connection value: ${rawValue}, type: ${typeof rawValue}, isConnected: ${isConnected}`);
        
        return (
          <StatusIndicator type={isConnected ? 'success' : 'error'}>
            {isConnected ? 'Connected' : 'Disconnected'}
          </StatusIndicator>
        );
      },
      sortingField: 'connected',
      minWidth: 50,
      width: findWidthInContentDisplay('connected', config)
    },
    {
      id: 'hasApplianceFW',
      header: 'Has Appliance Firmware',
      cell: (item: ThingSummary): ReactElement => (
        <StatusIndicator type={item.hasApplianceFW ? 'success' : 'error'}>
          {item.hasApplianceFW ? item.firmwareType || 'unknown' : 'day0'}
        </StatusIndicator>
      ),
      sortingField: 'hasApplianceFW',
      minWidth: 50,
      width: findWidthInContentDisplay('hasApplianceFW', config)
    },
    {
      id: 'lastConnectedAt',
      header: 'Last Connected',
      cell: (item: ThingSummary): string =>
        item.lastConnectedAt
          ? config.formatTimestamp(item.lastConnectedAt)
          : '-',
      sortingField: 'lastConnectedAt',
      minWidth: 50,
      width: findWidthInContentDisplay('lastConnectedAt', config)
    },
    {
      id: 'provisioningTimestamp',
      header: 'Provisioning Timestamp',
      cell: (item: ThingSummary): string =>
        item.provisioningTimestamp
          ? config.formatTimestamp(item.provisioningTimestamp)
          : '-',
      sortingField: 'provisioningTimestamp',
      minWidth: 50,
      width: findWidthInContentDisplay('provisioningTimestamp', config)
    },
    {
      id: 'brandName',
      header: 'Brand',
      cell: (item: ThingSummary): string => item.brandName || '-',
      sortingField: 'brandName',
      minWidth: 50,
      width: findWidthInContentDisplay('brandName', config)
    },
    {
      id: 'country',
      header: 'Country',
      cell: (item: ThingSummary): string => item.country || '-',
      sortingField: 'country',
      minWidth: 50,
      width: findWidthInContentDisplay('country', config)
    },
    {
      id: 'firmwareType',
      header: 'Firmware Type',
      cell: (item: ThingSummary): string => item.firmwareType || '-',
      sortingField: 'firmwareType',
      minWidth: 50,
      width: findWidthInContentDisplay('firmwareType', config)
    },
    {
      id: 'firmwareVersion',
      header: 'Firmware Version',
      cell: (item: ThingSummary): string => item.firmwareVersion || '-',
      sortingField: 'firmwareVersion',
      minWidth: 50,
      width: findWidthInContentDisplay('firmwareVersion', config)
    },
    {
      id: 'thingGroupNames',
      header: 'Thing Groups',
      cell: (item: ThingSummary): ReactElement => (
        <Box>
          {item.thingGroupNames?.length
            ? uniq(item.thingGroupNames).map(
                (group: string): ReactElement => (
                  <Badge key={group}>{group}</Badge>
                )
              )
            : '-'}
        </Box>
      ),
      sortingField: 'thingGroupNames',
      minWidth: 50,
      width: findWidthInContentDisplay('thingGroupNames', config)
    }
  ];
}
