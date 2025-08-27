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

import Container from '@cloudscape-design/components/container';
import Header from '@cloudscape-design/components/header';
import type { PieChartProps } from '@cloudscape-design/components/pie-chart';
import PieChart from '@cloudscape-design/components/pie-chart';
import { type FunctionComponent, type ReactElement } from 'react';
import Link from '@cloudscape-design/components/link';
import { useFollow, type FollowFunction } from '../hooks/UseFollow';
import './pie-chart-wrapper.css';

export interface PieChartWrapperProps {
  data: Array<PieChartProps.Datum>;
  title?: string;
  loading?: boolean;
  error?: string;
  segmentDescription?: string;
  size?: 'small' | 'medium' | 'large';
  hideBorder?: boolean;
  getPopoverLink?: (title: string) => string;
  variant?: 'default' | 'large';
}

export const PieChartWrapper: FunctionComponent<PieChartWrapperProps> = (
  props: PieChartWrapperProps
): ReactElement => {
  const handleFollow: FollowFunction = useFollow();
  const isLargeVariant: boolean = props.variant === 'large';

  // If data is empty or all zeros, use placeholder data
  const data: Array<PieChartProps.Datum> =
    !props.data ||
    props.data.length === 0 ||
    !props.data.some((d: PieChartProps.Datum): boolean => d.value > 0)
      ? [{ title: 'Sample', value: 1 }]
      : props.data;

  const chart: ReactElement = (
    <PieChart
      data={data}
      statusType={
        props.error ? 'error' : props.loading ? 'loading' : 'finished'
      }
      errorText={props.error}
      loadingText="Loading data ..."
      empty="No data"
      hideFilter
      hideLegend
      size={props.size || (isLargeVariant ? 'large' : 'small')}
      segmentDescription={(datum: PieChartProps.Datum, sum: number): string => {
        // Prevent division by zero
        const percentage: string =
          sum > 0 ? ((datum.value / sum) * 100).toFixed(1) : '0.0';
        return `${datum.value} ${props.segmentDescription || 'device'}${datum.value !== 1 ? 's' : ''} (${percentage}%)`;
      }}
      detailPopoverFooter={
        props.getPopoverLink
          ? (segment: PieChartProps.Datum): ReactElement => (
              <Link
                href={props.getPopoverLink?.(segment.title)}
                onFollow={handleFollow}
              >
                Show {props.segmentDescription || 'device'}
                {segment.value !== 1 ? 's' : ''}
              </Link>
            )
          : undefined
      }
    />
  );

  return (
    <div className="pie-chart-wrapper">
      {props.title && <Header variant="h3">{props.title}</Header>}
      <Container variant="stacked">{chart}</Container>
    </div>
  );
};
