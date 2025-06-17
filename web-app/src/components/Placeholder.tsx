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
