/**
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import StatusIndicator, {
  type StatusIndicatorProps
} from '@cloudscape-design/components/status-indicator';
import type { ReactElement } from 'react';

export interface PlaceholderProps {
  height?: number;
  status: StatusIndicatorProps.Type;
  fallbackText?: string;
  errorText?: string;
  warningText?: string;
  successText?: string;
  infoText?: string;
  stoppedText?: string;
  pendingText?: string;
  inProgressText?: string;
  loadingText?: string;
}

export default function Placeholder({
  height,
  status,
  fallbackText,
  errorText,
  warningText,
  successText,
  infoText,
  stoppedText,
  pendingText,
  inProgressText,
  loadingText
}: PlaceholderProps): ReactElement {
  const textLookup: Record<StatusIndicatorProps.Type, string | undefined> = {
    error: errorText,
    warning: warningText,
    success: successText,
    info: infoText,
    stopped: stoppedText,
    pending: pendingText,
    'in-progress': inProgressText,
    loading: loadingText
  };
  return (
    <div
      style={{
        height,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      <StatusIndicator type={status}>
        {textLookup[status] || fallbackText || ''}
      </StatusIndicator>
    </div>
  );
}
