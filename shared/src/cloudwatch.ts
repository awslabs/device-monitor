import {
  CloudWatchClient,
  GetMetricDataCommand,
  type GetMetricDataCommandOutput,
  type MetricDataQuery
} from '@aws-sdk/client-cloudwatch';
import { logger, tracer } from './powertools';
import type { MetricData } from './appsync';

const cloudWatchClient: CloudWatchClient = tracer.captureAWSv3Client(
  new CloudWatchClient({
    region: process.env.AWS_REGION
  })
);

export function getCloudWatchClient(): CloudWatchClient {
  return cloudWatchClient;
}

export async function getItemCountMetric(
  tableName: string,
  Period: number = 24 * 60 * 60, // 1 day
  StartTime: Date = new Date('2022-01-01T00:00:00.000Z'),
  differencing: boolean = false
): Promise<Array<MetricData>> {
  logger.debug('Getting table item count metric', { tableName });

  const EndTime: Date = new Date();
  const results: Array<MetricData> = [];
  let NextToken: string | undefined;
  do {
    const result: GetMetricDataCommandOutput = await cloudWatchClient.send(
      new GetMetricDataCommand({
        StartTime,
        EndTime,
        MetricDataQueries: [
          {
            Id: 'total',
            MetricStat: {
              Metric: {
                Namespace: 'AWS/DynamoDB',
                MetricName: 'ItemCount',
                Dimensions: [
                  {
                    Name: 'TableName',
                    Value: tableName
                  }
                ]
              },
              Period,
              Stat: 'Maximum'
            },
            ReturnData: !differencing
          },
          {
            Id: 'increase',
            Expression: 'DIFF(total)',
            ReturnData: differencing
          }
        ],
        NextToken
      })
    );
    if (
      result.MetricDataResults?.[0].Timestamps?.length !==
      result.MetricDataResults?.[0].Values?.length
    ) {
      throw new Error('Timestamps and Values length mismatch');
    }
    NextToken = result.NextToken;
    results.push(
      ...(result.MetricDataResults?.[0]?.Timestamps?.map(
        (timestamp: Date, index: number): MetricData => ({
          metric: tableName,
          timestamp: timestamp.toISOString(),
          value: result.MetricDataResults![0].Values![index] || 0
        })
      ) || [])
    );
  } while (NextToken);

  logger.debug('Got table item count metric', { tableName });
  return results;
}

export async function getConnectivityMetrics(
  metricNames: Array<string>,
  Period: number = 24 * 60 * 60, // 1 day
  StartTime: Date = new Date('2022-01-01T00:00:00.000Z'),
  Expression?: string
): Promise<Array<MetricData>> {
  logger.debug('Getting connectivity metrics', { metricNames });

  const EndTime: Date = new Date();
  const results: Array<MetricData> = [];
  let NextToken: string | undefined;
  do {
    const result: GetMetricDataCommandOutput = await cloudWatchClient.send(
      new GetMetricDataCommand({
        StartTime,
        EndTime,
        MetricDataQueries: [
          ...metricNames.map(
            (MetricName: string, index: number): MetricDataQuery => ({
              Id: `m${index + 1}`,
              Label: MetricName,
              ReturnData: !Expression,
              MetricStat: {
                Metric: {
                  Namespace: 'AWS/IoTFleetMetrics',
                  MetricName,
                  Dimensions: [
                    {
                      Name: 'AggregationType',
                      Value: 'count'
                    }
                  ]
                },
                Period,
                Stat: 'Maximum'
              }
            })
          ),
          ...(Expression
            ? [
                {
                  Id: 'e1',
                  Label: 'expression',
                  Expression
                }
              ]
            : [])
        ],
        NextToken
      })
    );
    NextToken = result.NextToken;
    for (const metric of result.MetricDataResults || []) {
      if (metric.Timestamps?.length !== metric.Values?.length) {
        throw new Error('Timestamps and Values length mismatch');
      }
      results.push(
        ...(metric.Timestamps?.map(
          (timestamp: Date, index: number): MetricData => ({
            metric: metric.Label!,
            timestamp: timestamp.toISOString(),
            value: metric.Values?.[index] || 0
          })
        ) || [])
      );
    }
  } while (NextToken);

  logger.debug('Got connectivity metrics', { metricNames });
  return results;
}
