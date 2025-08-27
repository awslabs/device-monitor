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

import type { GraphQLResult } from '@aws-amplify/api-graphql';
import {
  GetJobDetailsDocument,
  type GetJobDetailsQuery,
  type GetJobDetailsQueryVariables
} from '@bfw/shared/src/appsync';
import type { GenericReactState } from '@bfw/shared/src/types';
import {
  useEffect,
  useState,
  type FunctionComponent,
  type ReactElement
} from 'react';
import { client } from '../config/appsync-config';
import { PieChartWrapper } from './PieChartWrapper';
import type { KeyValuePairsProps } from '@cloudscape-design/components/key-value-pairs';
import type { PieChartProps } from '@cloudscape-design/components/pie-chart';
import ExpandableSection from '@cloudscape-design/components/expandable-section';
import KeyValuePairs from '@cloudscape-design/components/key-value-pairs';
import ColumnLayout from '@cloudscape-design/components/column-layout';
import Placeholder from './Placeholder';
import Link from '@cloudscape-design/components/link';
import { useAuthGroups, type UseAuthGroups } from '../hooks/UseAuthGroups';
import type { AmplifyQuery } from '../utils/AmplifyQuery';
import { useAws, type AwsContextType } from '../context/AwsContext';
import { convertPropertyFilterQueryToURLSearchParams } from '../utils/FilterUtil';

interface JobDetailsProps {
  jobId: string;
}

const statsTitleMapping: Record<string, string> = {
  canceled: 'Canceled',
  succeeded: 'Succeeded',
  failed: 'Failed',
  rejected: 'Rejected',
  queued: 'Queued',
  inProgress: 'In-Progress',
  removed: 'Removed',
  timedOut: 'Timed-Out'
};

const detailsTitleMapping: Record<string, string> = {
  targetSelection: 'Target Selection',
  status: 'Status',
  description: 'Description',
  abortThresholdPercentage: 'Abort Threshold',
  createdAt: 'Created At',
  lastUpdatedAt: 'Last Updated At',
  completedAt: 'Completed At',
  inProgressTimeoutInMinutes: 'Execution Timeout',
  numberOfRetries: 'Maximum Number of Retries'
};

const detailsUnitMapping: Record<string, string> = {
  abortThresholdPercentage: '%',
  inProgressTimeoutInMinutes: ' minutes'
};

const JobDetails: FunctionComponent<JobDetailsProps> = ({
  jobId
}: JobDetailsProps): ReactElement => {
  const { loading: loadingGroups, groups }: UseAuthGroups = useAuthGroups();
  const [jobDetails, setJobDetails]: GenericReactState<
    Array<KeyValuePairsProps.Pair>
  > = useState<Array<KeyValuePairsProps.Pair>>([]);
  const [jobStats, setJobStats]: GenericReactState<Array<PieChartProps.Datum>> =
    useState<Array<PieChartProps.Datum>>([]);
  const [loading, setLoading]: GenericReactState<boolean> = useState(true);
  const [error, setError]: GenericReactState<string | undefined> = useState<
    string | undefined
  >(undefined);
  const { accountId }: AwsContextType = useAws();

  async function fetchJobDetails(): Promise<void> {
    try {
      console.log('Fetching job details for:', jobId);
      const response: GraphQLResult<GetJobDetailsQuery> = await client.graphql<
        AmplifyQuery<GetJobDetailsQueryVariables, GetJobDetailsQuery>
      >({
        query: GetJobDetailsDocument,
        variables: { jobId }
      });

      if (response.errors && response.errors.length) {
        console.error('GraphQL errors:', response.errors);
        throw new AggregateError(response.errors, 'Received GraphQL errors');
      }
      if (!response.data?.getJobDetails) {
        console.error('Job not found');
        throw new Error('Job not found');
      }

      const {
        stats,
        targets,
        baseRatePerMinute,
        maximumRatePerMinute,
        ...details
      }: NonNullable<GetJobDetailsQuery['getJobDetails']> =
        response.data.getJobDetails;

      console.log('Job stats:', stats);

      // Ensure stats is not empty and has non-zero values
      if (
        stats &&
        Object.keys(stats).length > 0 &&
        Object.values(stats).some((value: number): boolean => value > 0)
      ) {
        setJobStats(
          Object.entries(stats).map(
            ([key, value]: [string, number]): PieChartProps.Datum => ({
              title: statsTitleMapping[key] || key,
              value: value || 0
            })
          )
        );
      } else {
        console.warn('No job stats available or all values are zero');
        // Set default stats with some placeholder values to ensure chart renders
        setJobStats([
          { title: 'Queued', value: 1 },
          { title: 'In-Progress', value: 0 },
          { title: 'Succeeded', value: 0 },
          { title: 'Failed', value: 0 }
        ]);
      }

      const detailPairs: Array<KeyValuePairsProps.Pair> = [
        {
          type: 'pair',
          label: 'Job Name',
          value: groups.includes('developers') ? (
            <Link
              href={`https://${accountId}.eu-central-1.console.aws.amazon.com/iot/home?region=eu-central-1#/job/${jobId}`}
              external
            >
              {jobId}
            </Link>
          ) : (
            jobId
          )
        }
      ];
      detailPairs.push(
        ...Object.entries(details)
          .filter(
            ([, value]: [string, number | string | null]): boolean =>
              value != null
          )
          .map(
            ([key, value]: [
              string,
              number | string | null
            ]): KeyValuePairsProps.Pair => ({
              type: 'pair',
              label: detailsTitleMapping[key] || key,
              value: value!.toString() + (detailsUnitMapping[key] || '')
            })
          )
      );
      if (targets) {
        const groupCount: number = targets.filter((target: string): boolean =>
          target.includes(':thinggroup/')
        ).length;
        const thingCount: number = targets.filter((target: string): boolean =>
          target.includes(':thing/')
        ).length;
        detailPairs.push({
          label: 'Targets',
          value: `${groupCount} group${groupCount !== 1 ? 's' : ''}, ${thingCount} individual device${thingCount !== 1 ? 's' : ''}`
        });
      }
      if (maximumRatePerMinute) {
        detailPairs.push({
          label: 'Rollout Rate',
          value: `${baseRatePerMinute ? `${baseRatePerMinute} - ` : ''}${maximumRatePerMinute} per minute`
        });
      }
      setJobDetails(detailPairs);
    } catch (error: unknown) {
      console.error('Error fetching job details', error);
      setError('Error fetching job details');
    } finally {
      setLoading(false);
    }
  }

  useEffect((): void => {
    if (!loadingGroups) {
      fetchJobDetails().catch(console.error);
    }
  }, [jobId, loadingGroups]);

  return (
    <ExpandableSection
      variant="container"
      headerText="Job Details"
      defaultExpanded
    >
      {loading || error ? (
        <Placeholder
          status={error ? 'error' : 'loading'}
          height={320}
          errorText={error}
          loadingText="Loading data"
        />
      ) : (
        <ColumnLayout columns={2}>
          <KeyValuePairs items={jobDetails} columns={2} />
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
              data={jobStats}
              hideBorder
              segmentDescription="execution"
              getPopoverLink={(value: string): string =>
                `/jobs/${jobId}?${convertPropertyFilterQueryToURLSearchParams({
                  operation: 'and',
                  tokens: [
                    {
                      operator: ':',
                      propertyKey: 'status',
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
export default JobDetails;
