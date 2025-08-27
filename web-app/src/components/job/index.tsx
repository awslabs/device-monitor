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
