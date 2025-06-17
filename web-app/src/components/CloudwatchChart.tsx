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
import type { GenericReactState } from '@bfw/shared/src/types';
import {
  GetCloudwatchMetricDataDocument,
  type CloudwatchMetricType,
  type GetCloudwatchMetricDataQuery,
  type MetricData,
  type GetCloudwatchMetricDataQueryVariables
} from '@bfw/shared/src/appsync';
import type { GraphQLResult } from '@aws-amplify/api-graphql';
import { countFormatter, timestampFormatter } from '@bfw/shared/src/utils';
import type { MixedLineBarChartProps } from '@cloudscape-design/components/mixed-line-bar-chart';
import Container from '@cloudscape-design/components/container';
import LineChart from '@cloudscape-design/components/line-chart';
import Header from '@cloudscape-design/components/header';
import type { AmplifyQuery } from '../utils/AmplifyQuery';
import Link from '@cloudscape-design/components/link';
import { useFollow, type FollowFunction } from '../hooks/UseFollow';

export interface CloudwatchChartProps {
  title: string;
  type: CloudwatchMetricType;
  days?: number;
  unit?: string;
  decimalPlaces?: number;
  getPopoverLink?: (title: string) => string;
  height?: number;
}

type WritableSeries = Omit<
  MixedLineBarChartProps.LineDataSeries<Date>,
  'data'
> & {
  data: Array<MixedLineBarChartProps.Datum<Date>>;
};

const titleMapping: Record<string, string> = {
  'iotconnectivitydashboard-connected-device-count': 'Connected',
  'iotconnectivitydashboard-disconnected-device-count': 'Disconnected',
  expression: 'Disconnect Rate',
  'dev-devices': 'Devices',
  'qa-devices': 'Devices',
  'prod-devices': 'Devices'
};

export const CloudwatchChart: FunctionComponent<CloudwatchChartProps> = (
  props: CloudwatchChartProps
): ReactElement => {
  const handleFollow: FollowFunction = useFollow();
  const [data, setMetricData]: GenericReactState<Array<MetricData>> = useState<
    Array<MetricData>
  >([]);
  const [loading, setLoading]: GenericReactState<boolean> = useState(true);
  const [error, setError]: GenericReactState<string | undefined> = useState<
    string | undefined
  >(undefined);

  async function fetchStats(): Promise<void> {
    try {
      const response: GraphQLResult<GetCloudwatchMetricDataQuery> =
        await client.graphql<
          AmplifyQuery<
            GetCloudwatchMetricDataQueryVariables,
            GetCloudwatchMetricDataQuery
          >
        >({
          query: GetCloudwatchMetricDataDocument,
          variables: {
            type: props.type,
            period: 60 * 60,
            start: new Date(
              Date.now() - (props.days || 7) * 24 * 60 * 60 * 1000
            ).toISOString()
          }
        });

      if (response.data.getCloudwatchMetricData) {
        setMetricData(response.data.getCloudwatchMetricData);
      }
    } catch (error: unknown) {
      console.error('Error fetching data:', error);
      setError('Error fetching data');
    } finally {
      setLoading(false);
    }
  }

  useEffect((): void => {
    fetchStats().catch(console.error);
  }, []);

  return (
    <Container header={<Header variant="h3">{props.title}</Header>}>
      <LineChart<Date>
        series={Object.values(
          data.reduce(
            (
              series: Record<string, WritableSeries>,
              d: MetricData
            ): Record<string, WritableSeries> => {
              series[d.metric] = series[d.metric] || {
                type: 'line',
                title: titleMapping[d.metric],
                data: []
              };
              series[d.metric].data.push({
                x: new Date(d.timestamp),
                y: d.value
              });
              return series;
            },
            {}
          )
        )}
        statusType={error ? 'error' : loading ? 'loading' : 'finished'}
        errorText={error}
        loadingText="Loading data ..."
        hideFilter
        hideLegend
        height={props.height || 172}
        emphasizeBaselineAxis
        detailPopoverSeriesContent={({
          series,
          y
        }: MixedLineBarChartProps.DetailPopoverSeriesData<Date>): MixedLineBarChartProps.DetailPopoverSeriesKeyValuePair => ({
          key: props.getPopoverLink ? (
            <Link
              href={props.getPopoverLink(series.title)}
              onFollow={handleFollow}
            >
              {series.title}
            </Link>
          ) : (
            series.title
          ),
          value: ['%', 'percent', 'percentage'].includes(
            (props.unit || '').toLowerCase()
          )
            ? `${y.toFixed(0)}%`
            : y
        })}
        xScaleType="time"
        xTickFormatter={timestampFormatter}
        yTickFormatter={(v: number): string =>
          countFormatter(v, props.decimalPlaces)
        }
        xTitle=""
        yScaleType="linear"
        yTitle=""
        yDomain={
          ['%', 'percent', 'percentage'].includes(
            (props.unit || '').toLowerCase()
          )
            ? [0, 100]
            : undefined
        }
      />
    </Container>
  );
};
