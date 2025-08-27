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

import Box from '@cloudscape-design/components/box';
import Container from '@cloudscape-design/components/container';
import Header from '@cloudscape-design/components/header';
import type { StatusIndicatorProps } from '@cloudscape-design/components/status-indicator';
import StatusIndicator from '@cloudscape-design/components/status-indicator';
import type { TableProps } from '@cloudscape-design/components/table';
import Table from '@cloudscape-design/components/table';
import { type FunctionComponent, type ReactElement } from 'react';

interface Violation {
  id: string;
  violationType: string;
  description: string;
  severity: string;
  ts: string;
}

interface BehaviorViolationsTabProps {
  behaviorViolations: Array<Violation> | null;
}

function getSeverityType(severity: string): StatusIndicatorProps.Type {
  switch (severity.toLowerCase()) {
    case 'critical':
      return 'error';
    case 'high':
      return 'warning';
    case 'medium':
      return 'info';
    case 'low':
      return 'pending';
    default:
      return 'info';
  }
}

export const BehaviorViolationsTab: FunctionComponent<
  BehaviorViolationsTabProps
> = ({ behaviorViolations }: BehaviorViolationsTabProps): ReactElement => {
  const columnDefinitions: ReadonlyArray<
    TableProps.ColumnDefinition<Violation>
  > = [
    {
      id: 'id',
      header: 'ID',
      cell: (item: Violation): string => item.id
    },
    {
      id: 'type',
      header: 'Type',
      cell: (item: Violation): string => item.violationType
    },
    {
      id: 'description',
      header: 'Description',
      cell: (item: Violation): string => item.description
    },
    {
      id: 'severity',
      header: 'Severity',
      cell: (item: Violation): ReactElement => (
        <StatusIndicator type={getSeverityType(item.severity)}>
          {item.severity}
        </StatusIndicator>
      )
    },
    {
      id: 'timestamp',
      header: 'Timestamp',
      cell: (item: Violation): string => new Date(item.ts).toLocaleString()
    }
  ];

  if (!behaviorViolations) {
    return (
      <Container>
        <Box textAlign="center" color="inherit">
          No behavior violations data available
        </Box>
      </Container>
    );
  }

  return (
    <Container header={<Header variant="h3">Behavior Violations</Header>}>
      <Table<Violation>
        columnDefinitions={columnDefinitions}
        items={behaviorViolations}
        trackBy="id"
        empty={
          <Box textAlign="center" color="inherit">
            No behavior violations found
          </Box>
        }
        wrapLines
        sortingDisabled={false}
      />
    </Container>
  );
};
