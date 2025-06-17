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
import { JobExecutionList } from '../JobExecutionList';
import { useNavigate, useParams } from 'react-router-dom';
import JobDetails from '../JobDetails';
import ContentLayout from '@cloudscape-design/components/content-layout';
import Header from '@cloudscape-design/components/header';
import SpaceBetween from '@cloudscape-design/components/space-between';

export const JobDetailPage: FunctionComponent = (): ReactElement => {
  const params: { jobId?: string } = useParams<'jobId'>();
  if (!params.jobId) {
    useNavigate()('/jobs')?.catch(console.error);
    return <>Redirecting ...</>;
  }

  return (
    <ContentLayout
      header={
        <Header
          variant="h1"
          description="Monitor and manage individual job executions"
        >
          {params.jobId}
        </Header>
      }
    >
      <SpaceBetween size="l" direction="vertical">
        <JobDetails jobId={params.jobId} />

        <JobExecutionList jobId={params.jobId} />
      </SpaceBetween>
    </ContentLayout>
  );
};
