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
import {
  GetLatestVersionStatsDocument,
  type GetLatestVersionStatsQuery,
  type GetLatestVersionStatsQueryVariables
} from '@bfw/shared/src/appsync';
import { PieChartWrapper } from './PieChartWrapper';
import type { GraphQLResult } from '@aws-amplify/api-graphql';
import type { PieChartProps } from '@cloudscape-design/components/pie-chart';
import ExpandableSection from '@cloudscape-design/components/expandable-section';
import ColumnLayout from '@cloudscape-design/components/column-layout';
import Placeholder from './Placeholder';
import type { AmplifyQuery } from '../utils/AmplifyQuery';

type VersionStats = Record<string, Record<string, number>>;

export const VersionStats: FunctionComponent = (): ReactElement => {
  const [stats, setStats]: GenericReactState<VersionStats> = useState({});
  const [loading, setLoading]: GenericReactState<boolean> = useState(true);
  const [error, setError]: GenericReactState<string | undefined> = useState<
    string | undefined
  >(undefined);

  async function fetchStats(): Promise<void> {
    try {
      const response: GraphQLResult<GetLatestVersionStatsQuery> =
        await client.graphql<
          AmplifyQuery<
            GetLatestVersionStatsQueryVariables,
            GetLatestVersionStatsQuery
          >
        >({
          query: GetLatestVersionStatsDocument
        });

      if (
        typeof response.data.getLatestDeviceStats?.versionDistribution ===
        'string'
      ) {
        setStats(
          JSON.parse(
            response.data.getLatestDeviceStats.versionDistribution
          ) as VersionStats
        );
      }
    } catch (error: unknown) {
      console.error('Error fetching version stats:', error);
      setError('Error fetching version stats');
    } finally {
      setLoading(false);
    }
  }

  useEffect((): void => {
    fetchStats().catch(console.error);
  }, []);

  const diagrams: Array<ReactElement> = Object.entries(stats).map(
    ([packageName, versionDistribution]: [
      string,
      Record<string, number>
    ]): ReactElement => (
      <PieChartWrapper
        key={packageName}
        title={packageName}
        data={Object.entries(versionDistribution || {}).map(
          ([title, value]: [string, number]): PieChartProps.Datum => ({
            title,
            value
          })
        )}
      />
    )
  );

  return (
    <ExpandableSection
      variant="container"
      headerText="Version Distribution"
      defaultExpanded
    >
      {loading || error ? (
        <Placeholder
          status={error ? 'error' : 'loading'}
          height={347}
          errorText={error}
          loadingText="Loading data"
        />
      ) : (
        <ColumnLayout columns={2}>{diagrams}</ColumnLayout>
      )}
    </ExpandableSection>
  );
};
