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

import {
  useEffect,
  useState,
  type FunctionComponent,
  type ReactElement
} from 'react';
import { client } from '../config/appsync-config';
import type {
  GenericReactState,
  ReactEffectDestructor
} from '@bfw/shared/src/types';
import {
  type GraphQLResult,
  type GraphQLSubscription,
  type GraphqlSubscriptionMessage
} from '@aws-amplify/api-graphql';
import {
  GetLatestDeviceStatsDocument,
  CloudwatchMetricType,
  OnNewDeviceStatsDocument,
  type GetLatestDeviceStatsQuery,
  type GetLatestDeviceStatsQueryVariables,
  type OnNewDeviceStatsSubscription
} from '@bfw/shared/src/appsync';
import type { Subscription } from 'rxjs/internal/Subscription';
import { CloudwatchChart } from './CloudwatchChart';
import { PieChartWrapper } from './PieChartWrapper';
import ColumnLayout from '@cloudscape-design/components/column-layout';
import type { PieChartProps } from '@cloudscape-design/components/pie-chart';
import type { AmplifyQuery } from '../utils/AmplifyQuery';
import { convertPropertyFilterQueryToURLSearchParams } from '../utils/FilterUtil';
import { FleetStats } from './FleetStats';
import SpaceBetween from '@cloudscape-design/components/space-between';
import Header from '@cloudscape-design/components/header';

type DeviceStats = NonNullable<
  GetLatestDeviceStatsQuery['getLatestDeviceStats']
>;

type ParsedDeviceStats = Omit<
  DeviceStats,
  | 'brandNameDistribution'
  | 'countryDistribution'
  | 'productTypeDistribution'
  | 'disconnectDistribution'
  | 'groupDistribution'
  | 'deviceTypeDistribution'
> & {
  brandNameDistribution: Record<string, number>;
  countryDistribution: Record<string, number>;
  productTypeDistribution: Record<string, number>;
  disconnectDistribution: Record<string, number>;
  groupDistribution: Record<string, number>;
  deviceTypeDistribution: Record<string, number>;
};

const defaultStats: ParsedDeviceStats = {
  status: '',
  recordTime: '',
  registeredDevices: 0,
  connectedDevices: 0,
  disconnectedDevices: 0,
  brandNameDistribution: {},
  countryDistribution: {},
  productTypeDistribution: {},
  disconnectDistribution: {},
  groupDistribution: {},
  deviceTypeDistribution: {}
};

export const DeviceStatsContent: FunctionComponent = (): ReactElement => {
  const [stats, setStats]: GenericReactState<ParsedDeviceStats> =
    useState(defaultStats);
  const [loading, setLoading]: GenericReactState<boolean> = useState(true);
  const [error, setError]: GenericReactState<string | undefined> = useState<
    string | undefined
  >(undefined);

  function parseJsonIfNeeded(
    value: string | Record<string, number> | null
  ): Record<string, number> {
    if (typeof value === 'string') {
      try {
        return JSON.parse(value) as Record<string, number>;
      } catch (error: unknown) {
        console.error('Error parsing JSON:', error);
        return {};
      }
    }
    return value || {};
  }

  async function fetchStats(): Promise<void> {
    try {
      const response: GraphQLResult<GetLatestDeviceStatsQuery> =
        await client.graphql<
          AmplifyQuery<
            GetLatestDeviceStatsQueryVariables,
            GetLatestDeviceStatsQuery
          >
        >({
          query: GetLatestDeviceStatsDocument
        });

      if (response.data?.getLatestDeviceStats) {
        const statsData: DeviceStats = response.data.getLatestDeviceStats;
        setStats({
          ...statsData,
          brandNameDistribution: parseJsonIfNeeded(
            statsData.brandNameDistribution
          ),
          countryDistribution: parseJsonIfNeeded(statsData.countryDistribution),
          productTypeDistribution: parseJsonIfNeeded(
            statsData.productTypeDistribution
          ),
          disconnectDistribution: parseJsonIfNeeded(
            statsData.disconnectDistribution
          ),
          groupDistribution: parseJsonIfNeeded(statsData.groupDistribution),
          deviceTypeDistribution: parseJsonIfNeeded(
            statsData.deviceTypeDistribution
          )
        });
      }
    } catch (error: unknown) {
      console.error('Error fetching device stats:', error);
      setError('Error fetching device stats');
    } finally {
      setLoading(false);
    }
  }

  useEffect((): ReactEffectDestructor => {
    fetchStats().catch(console.error);

    let retryCount: number = 0;
    const maxRetries: number = 3;
    const retryDelay: number = 2000;

    function setupSubscription(): Subscription {
      const subscription: Subscription = client
        .graphql<GraphQLSubscription<OnNewDeviceStatsSubscription>>({
          query: OnNewDeviceStatsDocument
        })
        .subscribe({
          next: (
            response: GraphqlSubscriptionMessage<OnNewDeviceStatsSubscription>
          ): void => {
            const newStats: DeviceStats | ParsedDeviceStats =
              response.data?.onNewDeviceStats || defaultStats;
            setStats({
              ...newStats,
              brandNameDistribution: parseJsonIfNeeded(
                newStats.brandNameDistribution
              ),
              countryDistribution: parseJsonIfNeeded(
                newStats.countryDistribution
              ),
              productTypeDistribution: parseJsonIfNeeded(
                newStats.productTypeDistribution
              ),
              disconnectDistribution: parseJsonIfNeeded(
                newStats.disconnectDistribution
              ),
              groupDistribution: parseJsonIfNeeded(newStats.groupDistribution),
              deviceTypeDistribution: parseJsonIfNeeded(
                newStats.deviceTypeDistribution
              )
            });
          },
          error: (error: Error): void => {
            console.error('Subscription error:', error);

            if (retryCount < maxRetries) {
              retryCount++;
              console.log(
                `Retrying subscription (attempt ${retryCount}/${maxRetries})...`
              );
              setTimeout((): void => {
                subscription.unsubscribe();
                setupSubscription();
              }, retryDelay * retryCount); // Exponential backoff
            } else {
              console.error('Max retry attempts reached');
              // Use last known good state or default stats
              setStats(
                (prev: ParsedDeviceStats | null): ParsedDeviceStats =>
                  prev || defaultStats
              );
              setLoading(false);
            }
          }
        });

      return subscription;
    }

    const subscription: Subscription = setupSubscription();

    return (): void => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <SpaceBetween size="l">
      <FleetStats />
      <ColumnLayout columns={2}>
        <div
          style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
        >
          <Header variant="h3">Disconnection Rate</Header>
          <div style={{ flex: 1 }}>
            <CloudwatchChart
              title=""
              type={CloudwatchMetricType.DisconnectRate}
              days={14}
              unit="%"
              height={348}
            />
          </div>
        </div>
        <PieChartWrapper
          variant="large"
          title="Brand Name Distribution"
          data={Object.entries(stats.brandNameDistribution || {}).map(
            ([title, value]: [string, number]): PieChartProps.Datum => ({
              title,
              value
            })
          )}
          loading={loading}
          error={error}
          getPopoverLink={(value: string): string =>
            `/devices?${convertPropertyFilterQueryToURLSearchParams({
              operation: 'and',
              tokens: [
                {
                  operator: '=',
                  propertyKey: 'attributes.brandName',
                  value
                }
              ]
            })}`
          }
        />
        <PieChartWrapper
          variant="large"
          title="Country Distribution"
          data={Object.entries(stats.countryDistribution || {}).map(
            ([title, value]: [string, number]): PieChartProps.Datum => ({
              title,
              value
            })
          )}
          loading={loading}
          error={error}
          getPopoverLink={(value: string): string =>
            `/devices?${convertPropertyFilterQueryToURLSearchParams({
              operation: 'and',
              tokens: [
                {
                  operator: '=',
                  propertyKey: 'attributes.country',
                  value
                }
              ]
            })}`
          }
        />
        <PieChartWrapper
          variant="large"
          title="Device Type Distribution"
          data={Object.entries(stats.deviceTypeDistribution || {}).map(
            ([title, value]: [string, number]): PieChartProps.Datum => ({
              title,
              value
            })
          )}
          loading={loading}
          error={error}
          getPopoverLink={(value: string): string =>
            `/devices?${convertPropertyFilterQueryToURLSearchParams({
              operation: 'and',
              tokens: [
                {
                  operator: '=',
                  propertyKey: 'thingTypeName',
                  value
                }
              ]
            })}`
          }
        />
      </ColumnLayout>
    </SpaceBetween>
  );
};
