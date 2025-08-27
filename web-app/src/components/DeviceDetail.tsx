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
  type FunctionComponent,
  useState,
  useEffect,
  type ReactElement
} from 'react';
import {
  GetDeviceDocument,
  type GetDeviceQuery,
  type GetDeviceQueryVariables
} from '@bfw/shared/src/appsync';
import { client } from '../config/appsync-config';
import { DeviceAttributesTab } from './DeviceAttributesTab';
import { JobsTab } from './DeviceJobTab';
import { DefenderMetricsTab } from './DefenderMetricsTab';
import { ShadowTab } from './ShadowTab';
import { RetainedTopicsTab } from './RetainedTopicsTab';
import type { GenericReactState } from '@bfw/shared/src/types';
import type { GraphQLResult } from '@aws-amplify/api-graphql';
import type { GraphQLError } from 'graphql/error/GraphQLError';
import SpaceBetween from '@cloudscape-design/components/space-between';
import ContentLayout from '@cloudscape-design/components/content-layout';
import Header from '@cloudscape-design/components/header';
import StatusIndicator from '@cloudscape-design/components/status-indicator';
import ExpandableSection from '@cloudscape-design/components/expandable-section';
import Tabs, { type TabsProps } from '@cloudscape-design/components/tabs';
import type { NonCancelableCustomEvent } from '@cloudscape-design/components/interfaces';
import Badge from '@cloudscape-design/components/badge';
import Placeholder from './Placeholder';
import KeyValuePairs, {
  type KeyValuePairsProps
} from '@cloudscape-design/components/key-value-pairs';
import Link from '@cloudscape-design/components/link';
import { useAuthGroups, type UseAuthGroups } from '../hooks/UseAuthGroups';
import type { AmplifyQuery } from '../utils/AmplifyQuery';
import { useAws, type AwsContextType } from '../context/AwsContext';

interface DeviceDetailProps {
  thingName: string;
}

type DeviceDetails = NonNullable<GetDeviceQuery['getDevice']>;

const labelMapping: Record<keyof DeviceDetails, string> = {
  attributes: 'Attributes',
  connected: 'Connection State',
  deviceGroups: 'Device Groups',
  deviceType: 'Device Type',
  disconnectReason: 'Disconnect Reason',
  firmwareType: 'Firmware Type',
  firmwareVersion: 'Firmware Version',
  lastConnectedAt: 'Last Connected',
  thingName: 'Serial Number'
};

export const DeviceDetail: FunctionComponent<DeviceDetailProps> = ({
  thingName
}: DeviceDetailProps): ReactElement => {
  const { groups }: UseAuthGroups = useAuthGroups();
  const [activeTabId, setActiveTabId]: GenericReactState<string> =
    useState('attributes');
  const [loading, setLoading]: GenericReactState<boolean> = useState(true);
  const [error, setError]: GenericReactState<string | undefined> = useState<
    string | undefined
  >(undefined);
  const [deviceData, setDeviceData]: GenericReactState<DeviceDetails | null> =
    useState<DeviceDetails | null>(null);
  const { accountId }: AwsContextType = useAws();
  async function fetchDeviceData(): Promise<void> {
    try {
      setLoading(true);
      setError(undefined);

      if (!thingName) {
        throw new Error('Thing name is required');
      }

      const response: GraphQLResult<GetDeviceQuery> = await client.graphql<
        AmplifyQuery<GetDeviceQueryVariables, GetDeviceQuery>
      >({
        query: GetDeviceDocument,
        variables: {
          thingName
        }
      });

      if (response.errors && response.errors.length > 0) {
        const errorMessage: string = response.errors
          .map((error: GraphQLError): string => error.message)
          .join('\n');
        console.log('GraphQL Errors:', errorMessage);
        setError(errorMessage);
        setDeviceData(null);
        return;
      }

      if (response.data?.getDevice) {
        setDeviceData(response.data.getDevice);
      } else {
        setError('Device not found');
      }
    } catch (err: unknown) {
      console.error('Error fetching device details:', err);
      const response: GraphQLResult = err as GraphQLResult;
      if (response.errors && Array.isArray(response.errors)) {
        const errorMessage: string = response.errors
          .map((error: GraphQLError): string => error.message)
          .join('\n');
        setError(errorMessage);
      } else {
        setError((err as Error).message || 'An unexpected error occurred');
      }
      setDeviceData(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect((): void => {
    fetchDeviceData().catch(console.error);
  }, [thingName]);

  // Add debug logging for connection status
  useEffect(() => {
    if (deviceData) {
      console.log('DeviceDetail - Device Data:', deviceData);
      console.log('DeviceDetail - Connection Status:', deviceData.connected);
      console.log('DeviceDetail - Connection Status Type:', typeof deviceData.connected);
    }
  }, [deviceData]);

  return (
    <ContentLayout
      header={
        <Header
          variant="h1"
          description="Monitor and manage individual device details"
        >
          {thingName}
        </Header>
      }
    >
      <SpaceBetween size="l">
        {/* Top Information Pane */}
        <ExpandableSection
          variant="container"
          headerText="Device Details"
          defaultExpanded
        >
          {loading || error || !deviceData ? (
            <Placeholder
              status={error ? 'error' : loading ? 'loading' : 'stopped'}
              height={161}
              errorText={error}
              loadingText="Loading data"
              stoppedText="No device data available"
            />
          ) : (
            <KeyValuePairs
              columns={3}
              items={Object.entries(deviceData)
                .filter(
                  ([key]: [string, unknown]): boolean =>
                    !['attributes'].includes(key)
                )
                .map(
                  ([key, value]: [
                    string,
                    unknown
                  ]): KeyValuePairsProps.Pair => {
                    let formattedValue: ReactElement | string =
                      (value as string) || '-';
                    switch (key) {
                      case 'connected':
                        // Handle connection status explicitly
                        // Convert to boolean and log for debugging
                        const rawValue = value;
                        const isConnected = rawValue === true || rawValue === 'true';
                        console.log(`DeviceDetail - Raw connection value: ${rawValue}, type: ${typeof rawValue}, isConnected: ${isConnected}`);
                        
                        formattedValue = (
                          <StatusIndicator
                            type={isConnected ? 'success' : 'error'}
                          >
                            {isConnected ? 'Connected' : 'Disconnected'}
                          </StatusIndicator>
                        );
                        break;
                      case 'lastConnectedAt':
                        formattedValue = value
                          ? new Date(value as string).toLocaleString()
                          : '-';
                        break;
                      case 'thingName':
                        formattedValue = groups.includes('developers') ? (
                          <Link
                            href={`https://${accountId}.eu-central-1.console.aws.amazon.com/iot/home?region=eu-central-1#/thing/${value as string}`}
                            external
                          >
                            {value as string}
                          </Link>
                        ) : (
                          (value as string)
                        );
                        break;
                      case 'deviceGroups':
                        formattedValue = (
                          <SpaceBetween size="xxxs">
                            {(value as Array<string>)?.map(
                              (group: string): ReactElement => (
                                <Badge key={group}>{group}</Badge>
                              )
                            )}
                          </SpaceBetween>
                        );
                        break;
                      case 'firmwareType':
                        if (
                          !value &&
                          deviceData.deviceGroups.some(
                            (group: string): boolean =>
                              group.startsWith('day_0')
                          )
                        ) {
                          formattedValue = 'day0';
                        }
                        break;
                    }
                    return {
                      type: 'pair',
                      label: labelMapping[key as keyof DeviceDetails] || key,
                      value: formattedValue
                    };
                  }
                )}
            />
          )}
        </ExpandableSection>

        {loading || error || !deviceData || (
          <Tabs
            variant="container"
            activeTabId={activeTabId}
            onChange={({
              detail
            }: NonCancelableCustomEvent<TabsProps.ChangeDetail>): void =>
              setActiveTabId(detail.activeTabId)
            }
            tabs={[
              {
                label: 'Device Attributes',
                id: 'attributes',
                content: (
                  <DeviceAttributesTab attributes={deviceData.attributes} />
                )
              },
              {
                label: 'Jobs',
                id: 'jobs',
                content: <JobsTab thingName={thingName} />
              },
              {
                label: 'Defender Metrics',
                id: 'defender',
                content: <DefenderMetricsTab thingName={thingName} />
              },
              {
                label: 'Device Shadows',
                id: 'shadow',
                content: <ShadowTab thingName={thingName} />
              },
              {
                label: 'Retained Topics',
                id: 'topics',
                content: <RetainedTopicsTab thingName={thingName} />
              }
              /*           {
              label: 'Behavior Violations',
              id: 'violations',
              content: <BehaviorViolationsTab behaviorViolations={null} />
            }
*/
            ]}
          />
        )}
      </SpaceBetween>
    </ContentLayout>
  );
};
