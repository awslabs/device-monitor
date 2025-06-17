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

import { parseJsonNoThrow } from '@bfw/shared/src/utils';
import Box from '@cloudscape-design/components/box';
import Table from '@cloudscape-design/components/table';
import type { FunctionComponent, ReactElement } from 'react';

interface DeviceAttributesProps {
  attributes: string | null;
}

// Define an interface for the attribute table items
interface AttributeItem {
  key: string;
  value: unknown;
}

function formatAttributeValue(value: unknown): string {
  if (value === null || value === undefined) return 'N/A';

  // Special handling for dates
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value)) {
    try {
      return new Date(value).toLocaleString();
    } catch {
      return value;
    }
  }

  // Handle objects and arrays
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value, null, 2);
    } catch {
      // eslint-disable-next-line @typescript-eslint/no-base-to-string
      return String(value);
    }
  }

  // Default string conversion
  // eslint-disable-next-line @typescript-eslint/no-base-to-string
  return String(value);
}

export const DeviceAttributesTab: FunctionComponent<DeviceAttributesProps> = ({
  attributes
}: DeviceAttributesProps): ReactElement => {
  return (
    <Table<AttributeItem>
      columnDefinitions={[
        {
          id: 'key',
          header: 'Attribute',
          cell: ({ key }: AttributeItem): string => key
        },
        {
          id: 'value',
          header: 'Value',
          cell: ({ value }: AttributeItem): string =>
            formatAttributeValue(value)
        }
      ]}
      items={Object.entries(
        parseJsonNoThrow<Record<string, unknown>, object>(attributes || '', {})
      ).map(
        ([key, value]: [string, unknown]): AttributeItem => ({
          key,
          value
        })
      )}
      trackBy="key"
      empty={
        <Box margin={{ vertical: 'xs' }} textAlign="center" color="inherit">
          No attributes found
        </Box>
      }
    />
  );
};
