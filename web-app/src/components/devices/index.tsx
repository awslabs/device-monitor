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

import { type FunctionComponent, type ReactElement } from 'react';
import { DeviceList } from '../DeviceList';
import { FleetStats } from '../FleetStats';
import ContentLayout from '@cloudscape-design/components/content-layout';
import Header from '@cloudscape-design/components/header';
import SpaceBetween from '@cloudscape-design/components/space-between';

export const DevicesPage: FunctionComponent = (): ReactElement => {
  return (
    <ContentLayout
      header={
        <Header variant="h1" description="Monitor and manage connected devices">
          Device Management
        </Header>
      }
    >
      <SpaceBetween size="l" direction="vertical">
        <FleetStats />
        <DeviceList />
      </SpaceBetween>
    </ContentLayout>
  );
};
