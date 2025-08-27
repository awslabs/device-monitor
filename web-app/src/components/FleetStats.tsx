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

import {
  useEffect,
  useState,
  type FunctionComponent,
  type ReactElement
} from 'react';
import { client } from '../config/appsync-config';
import type { GenericReactState } from '@bfw/shared/src/types';
import { parseJsonNoThrow } from '@bfw/shared/src/utils';
import {
  GetLatestFleetStatsDocument,
  type GetLatestFleetStatsQuery,
  type GetLatestFleetStatsQueryVariables
} from '@bfw/shared/src/appsync';
import { PieChartWrapper } from './PieChartWrapper';
import type { GraphQLResult } from '@aws-amplify/api-graphql';
import ExpandableSection from '@cloudscape-design/components/expandable-section';
import ColumnLayout from '@cloudscape-design/components/column-layout';
import KeyValuePairs from '@cloudscape-design/components/key-value-pairs';
import Box from '@cloudscape-design/components/box';
import type { PieChartProps } from '@cloudscape-design/components/pie-chart';
import Placeholder from './Placeholder';
import type { AmplifyQuery } from '../utils/AmplifyQuery';
import { convertPropertyFilterQueryToURLSearchParams } from '../utils/FilterUtil';

type FleetStats = NonNullable<GetLatestFleetStatsQuery['getLatestDeviceStats']>;

export const FleetStats: FunctionComponent = (): ReactElement => {
  const [stats, setStats]: GenericReactState<FleetStats> = useState({
    recordTime: '',
    connectedDevices: 0,
    disconnectedDevices: 0,
    registeredDevices: 0,
    disconnectDistribution: '{}'
  });
  const [loading, setLoading]: GenericReactState<boolean> = useState(true);
  const [error, setError]: GenericReactState<string | undefined> = useState<
    string | undefined
  >(undefined);

  async function fetchStats(): Promise<void> {
    try {
      const response: GraphQLResult<GetLatestFleetStatsQuery> =
        await client.graphql<
          AmplifyQuery<
            GetLatestFleetStatsQueryVariables,
            GetLatestFleetStatsQuery
          >
        >({
          query: GetLatestFleetStatsDocument
        });

      if (response.data.getLatestDeviceStats) {
        setStats(response.data.getLatestDeviceStats);
      }
    } catch (error: unknown) {
      console.error('Error fetching fleet stats:', error);
      setError('Error fetching fleet stats');
    } finally {
      setLoading(false);
    }
  }

  useEffect((): void => {
    fetchStats().catch(console.error);
  }, []);

  return (
    <ExpandableSection
      variant="container"
      headerText="Fleet Details"
      defaultExpanded
    >
      {loading || error ? (
        <Placeholder
          status={error ? 'error' : 'loading'}
          height={180}
          errorText={error}
          loadingText="Loading data"
        />
      ) : (
        <ColumnLayout columns={3}>
          <KeyValuePairs
            items={[
              {
                label: 'Registered Devices',
                value: (
                  <Box fontSize="display-l" fontWeight="bold">
                    {stats.registeredDevices}
                  </Box>
                )
              }
            ]}
          />
          <div
            style={{
              justifyContent: 'center',
              height: '100%',
              display: 'flex',
              marginTop: '-24px',
              flexDirection: 'column'
            }}
          >
            <PieChartWrapper
              data={[
                {
                  title: 'Connected',
                  value: stats.connectedDevices
                },
                {
                  title: 'Disconnected',
                  value: stats.disconnectedDevices
                }
              ]}
              hideBorder
              size="small"
              getPopoverLink={(title: string): string =>
                `/devices?${convertPropertyFilterQueryToURLSearchParams({
                  operation: 'and',
                  tokens: [
                    {
                      operator: '=',
                      propertyKey: 'connectivity.connected',
                      value: title === 'Connected' ? 'true' : 'false'
                    }
                  ]
                })}`
              }
            />
          </div>
          <div
            style={{
              justifyContent: 'center',
              height: '100%',
              display: 'flex',
              marginTop: '-24px',
              flexDirection: 'column'
            }}
          >
            <PieChartWrapper
              data={Object.entries(
                parseJsonNoThrow<
                  Record<string, number>,
                  Record<string, number>
                >(stats.disconnectDistribution, {})
              ).map(
                ([title, value]: [string, number]): PieChartProps.Datum => ({
                  title,
                  value
                })
              )}
              hideBorder
              size="small"
              getPopoverLink={(value: string): string =>
                `/devices?${convertPropertyFilterQueryToURLSearchParams({
                  operation: 'and',
                  tokens: [
                    {
                      operator: '=',
                      propertyKey: 'connectivity.disconnectReason',
                      value
                    }
                  ]
                })}`
              }
            />
          </div>
        </ColumnLayout>
      )}
    </ExpandableSection>
  );
};
