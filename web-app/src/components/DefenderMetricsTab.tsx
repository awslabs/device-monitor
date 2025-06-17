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
  useMemo,
  useState,
  type FunctionComponent,
  type ReactElement
} from 'react';
import { client } from '../config/appsync-config';
import {
  type GetDefenderMetricDataQuery,
  type GetDefenderMetricDataQueryVariables,
  type MetricData,
  DefenderMetricType,
  GetDefenderMetricDataDocument
} from '@bfw/shared/src/appsync';
import type { GenericReactState } from '@bfw/shared/src/types';
import type { GraphQLResult } from '@aws-amplify/api-graphql';
import type { GraphQLError } from 'graphql';
import {
  countFormatter,
  timeAmountFormatter,
  timestampFormatter
} from '@bfw/shared/src/utils';
import type { DateRangePickerProps } from '@cloudscape-design/components/date-range-picker';
import type { MixedLineBarChartProps } from '@cloudscape-design/components/mixed-line-bar-chart';
import type { NonCancelableCustomEvent } from '@cloudscape-design/components/interfaces';
import Container from '@cloudscape-design/components/container';
import SpaceBetween from '@cloudscape-design/components/space-between';
import ColumnLayout from '@cloudscape-design/components/column-layout';
import FormField from '@cloudscape-design/components/form-field';
import DateRangePicker from '@cloudscape-design/components/date-range-picker';
import LineChart from '@cloudscape-design/components/line-chart';
import Box from '@cloudscape-design/components/box';
import SegmentedControl, {
  type SegmentedControlProps
} from '@cloudscape-design/components/segmented-control';
import type { AmplifyQuery } from '../utils/AmplifyQuery';

const CLOUD_SIDE_METRICS: Record<DefenderMetricType, string> = {
  [DefenderMetricType.AuthorizationFailures]: 'Authorization failures',
  [DefenderMetricType.ConnectionAttempts]: 'Connection attempts',
  [DefenderMetricType.Disconnects]: 'Disconnects',
  [DefenderMetricType.DisconnectDuration]: 'Disconnect duration'
};

interface DateRange {
  startDate: Date;
  endDate: Date;
}

// Helper function to get actual Date objects from the DateRangePicker value
function getDateRange(value: DateRangePickerProps.Value): DateRange {
  const endDate: Date = new Date();

  if (value.type === 'absolute') {
    return {
      startDate: new Date(value.startDate),
      endDate: new Date(value.endDate)
    };
  } else {
    const startDate: Date = new Date();
    switch (value.unit) {
      case 'day':
        startDate.setDate(endDate.getDate() - value.amount);
        break;
      case 'week':
        startDate.setDate(endDate.getDate() - value.amount * 7);
        break;
      case 'month':
        startDate.setMonth(endDate.getMonth() - value.amount);
        break;
    }
    return { startDate, endDate };
  }
}

type DefenderMetricsTabProps = {
  thingName: string;
};

export const DefenderMetricsTab: FunctionComponent<DefenderMetricsTabProps> = ({
  thingName
}: DefenderMetricsTabProps): ReactElement => {
  const [selectedId, setSelectedId]: GenericReactState<DefenderMetricType> =
    useState<DefenderMetricType>(DefenderMetricType.Disconnects);
  const [
    dateRange,
    setDateRange
  ]: GenericReactState<DateRangePickerProps.Value> =
    useState<DateRangePickerProps.Value>({
      key: '7d',
      type: 'relative',
      amount: 7,
      unit: 'day'
    });

  const [loading, setLoading]: GenericReactState<boolean> = useState(false);
  const [error, setError]: GenericReactState<string | undefined> = useState<
    string | undefined
  >(undefined);
  const [chartData, setChartData]: GenericReactState<
    Array<MixedLineBarChartProps.Datum<Date>>
  > = useState<Array<MixedLineBarChartProps.Datum<Date>>>([]);

  async function fetchMetricData(): Promise<void> {
    if (!selectedId) return;

    const { startDate, endDate }: DateRange = getDateRange(dateRange);
    setLoading(true);
    setError(undefined);

    try {
      const response: GraphQLResult<GetDefenderMetricDataQuery> =
        await client.graphql<
          AmplifyQuery<
            GetDefenderMetricDataQueryVariables,
            GetDefenderMetricDataQuery
          >
        >({
          query: GetDefenderMetricDataDocument,
          variables: {
            thingName,
            type: selectedId,
            startTime: startDate.toISOString(),
            endTime: endDate.toISOString()
          }
        });

      if (response.errors) {
        console.log('Failed to load metric data', response.errors);
        setError('Failed to load metric data');
        setChartData([]);
        return;
      }

      // Transform the data for the chart
      const transformedData: Array<MixedLineBarChartProps.Datum<Date>> =
        response.data.getDefenderMetricData?.map(
          (item: MetricData): MixedLineBarChartProps.Datum<Date> => {
            return {
              x: new Date(item.timestamp),
              y: item.value
            };
          }
        ) || [];

      setChartData(transformedData);
    } catch (error: unknown) {
      console.error('Error fetching metric data:', error);
      const response: GraphQLResult = error as GraphQLResult;
      if (Array.isArray(response?.errors)) {
        setError(
          response?.errors
            .map((ge: GraphQLError): string => ge.message)
            .join('\n')
        );
      } else {
        setError(
          error instanceof Error ? error.message : 'Failed to load metric data'
        );
      }
      setChartData([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect((): void => {
    if (selectedId) {
      fetchMetricData().catch(console.error);
    }
  }, [selectedId, dateRange]);

  const chartSeries: ReadonlyArray<
    MixedLineBarChartProps.LineDataSeries<Date>
  > = useMemo((): ReadonlyArray<
    MixedLineBarChartProps.LineDataSeries<Date>
  > => {
    if (!chartData.length) return [];

    return [
      {
        title: selectedId || '',
        type: 'line',
        data: chartData,
        valueFormatter: (v: number): string =>
          selectedId === DefenderMetricType.DisconnectDuration
            ? timeAmountFormatter(v)
            : countFormatter(v)
      }
    ];
  }, [chartData, selectedId]);

  function handleMetricChange(
    event: NonCancelableCustomEvent<SegmentedControlProps.ChangeDetail>
  ): void {
    setSelectedId(event.detail.selectedId as DefenderMetricType);
  }

  function handleDateRangeChange(
    event: NonCancelableCustomEvent<DateRangePickerProps.ChangeDetail>
  ): void {
    if (event.detail.value) {
      setDateRange(event.detail.value);
    }
  }

  return (
    <Container>
      <SpaceBetween size="l">
        <ColumnLayout columns={2}>
          <FormField label="Metrics" stretch>
            <SegmentedControl
              selectedId={selectedId}
              onChange={handleMetricChange}
              options={Object.entries(CLOUD_SIDE_METRICS).map(
                ([id, text]: [
                  string,
                  string
                ]): SegmentedControlProps.Option => ({ id, text })
              )}
            />
          </FormField>

          <FormField label="Time Range">
            <DateRangePicker
              value={dateRange}
              onChange={handleDateRangeChange}
              relativeOptions={[
                {
                  key: '1d',
                  amount: 1,
                  unit: 'day',
                  type: 'relative'
                },
                {
                  key: '7d',
                  amount: 7,
                  unit: 'day',
                  type: 'relative'
                },
                {
                  key: '14d',
                  amount: 14,
                  unit: 'day',
                  type: 'relative'
                }
              ]}
              isDateEnabled={(date: Date): boolean =>
                date <= new Date() &&
                date >= new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)
              }
              placeholder="Select a date range"
              i18nStrings={{
                todayAriaLabel: 'Today',
                nextMonthAriaLabel: 'Next month',
                previousMonthAriaLabel: 'Previous month',
                customRelativeRangeOptionLabel: 'Custom range',
                customRelativeRangeOptionDescription:
                  'Set a custom range in the past',
                relativeModeTitle: 'Relative range',
                absoluteModeTitle: 'Absolute range',
                relativeRangeSelectionHeading: 'Choose a range',
                startDateLabel: 'Start date',
                endDateLabel: 'End date',
                startTimeLabel: 'Start time',
                endTimeLabel: 'End time',
                clearButtonLabel: 'Clear and dismiss',
                cancelButtonLabel: 'Cancel',
                applyButtonLabel: 'Apply',
                formatRelativeRange: (
                  value: DateRangePickerProps.RelativeValue
                ): string => {
                  const unitString: string =
                    value.amount === 1 ? value.unit : `${value.unit}s`;
                  return `Last ${value.amount} ${unitString}`;
                }
              }}
              isValidRange={(
                range: DateRangePickerProps.Value | null
              ): DateRangePickerProps.ValidationResult => {
                if (!range) {
                  return {
                    valid: false,
                    errorMessage: 'Please select a date range'
                  };
                }

                if (range.type === 'absolute') {
                  const start: Date = new Date(range.startDate);
                  const end: Date = new Date(range.endDate);

                  if (end < start) {
                    return {
                      valid: false,
                      errorMessage: 'End date must be after start date'
                    };
                  }

                  if (end > new Date()) {
                    return {
                      valid: false,
                      errorMessage: 'Cannot select future dates'
                    };
                  }

                  // Optional: Add maximum range limit
                  const maxRangeMs: number = 365 * 24 * 60 * 60 * 1000; // 1 year
                  if (end.getTime() - start.getTime() > maxRangeMs) {
                    return {
                      valid: false,
                      errorMessage: 'Date range cannot exceed 1 year'
                    };
                  }
                }

                return { valid: true };
              }}
            />
          </FormField>
        </ColumnLayout>
        <LineChart
          series={chartSeries}
          statusType={error ? 'error' : loading ? 'loading' : 'finished'}
          errorText={error}
          hideFilter
          hideLegend
          emphasizeBaselineAxis
          xScaleType="time"
          xTitle="Time"
          yScaleType="linear"
          xTickFormatter={timestampFormatter}
          yTickFormatter={
            selectedId === DefenderMetricType.DisconnectDuration
              ? timeAmountFormatter
              : countFormatter
          }
          yTitle={
            selectedId === DefenderMetricType.DisconnectDuration
              ? 'Duration'
              : 'Count'
          }
          height={300}
          loadingText="Loading chart"
          empty={
            <Box textAlign="center" color="inherit">
              <b>No data available</b>
              <Box variant="p" color="inherit">
                {selectedId
                  ? 'There is no data available for the selected time range.'
                  : 'Please select a metric.'}
              </Box>
            </Box>
          }
        />
      </SpaceBetween>
    </Container>
  );
};
