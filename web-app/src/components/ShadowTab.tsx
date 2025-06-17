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

import {
  type FunctionComponent,
  useState,
  useEffect,
  type ReactElement
} from 'react';
import {
  GetThingShadowDocument,
  type GetThingShadowQuery,
  type GetThingShadowQueryVariables
} from '@bfw/shared/src/appsync';
import { client } from '../config/appsync-config';
import type { GenericReactState, ThingShadow } from '@bfw/shared/src/types';
import type { GraphQLError } from 'graphql/error/GraphQLError';
import type { GraphQLResult } from '@aws-amplify/api-graphql';
import Container from '@cloudscape-design/components/container';
import FormField from '@cloudscape-design/components/form-field';
import SegmentedControl, {
  type SegmentedControlProps
} from '@cloudscape-design/components/segmented-control';
import { ShadowName } from '@bfw/shared/src/enums';
import Placeholder from './Placeholder';
import { CodeView } from '@cloudscape-design/code-view';
import jsonHighlight from '@cloudscape-design/code-view/highlight/json';
import type { NonCancelableCustomEvent } from '@cloudscape-design/components/interfaces';
import SpaceBetween from '@cloudscape-design/components/space-between';
import Button from '@cloudscape-design/components/button';
import type { AmplifyQuery } from '../utils/AmplifyQuery';

interface ShadowTabProps {
  thingName: string;
  shadowName?: ShadowName;
}

export const ShadowTab: FunctionComponent<ShadowTabProps> = ({
  thingName,
  shadowName = ShadowName.Classic
}: ShadowTabProps): ReactElement => {
  const [selectedId, setSelectedId]: GenericReactState<ShadowName> =
    useState<ShadowName>(shadowName);
  const [loading, setLoading]: GenericReactState<boolean> = useState(true);
  const [error, setError]: GenericReactState<string | undefined> = useState<
    string | undefined
  >(undefined);
  const [shadowData, setShadowData]: GenericReactState<ThingShadow | null> =
    useState<ThingShadow | null>(null);

  async function fetchShadowData(): Promise<void> {
    try {
      setLoading(true);
      setError(undefined);

      const response: GraphQLResult<GetThingShadowQuery> = await client.graphql<
        AmplifyQuery<GetThingShadowQueryVariables, GetThingShadowQuery>
      >({
        query: GetThingShadowDocument,
        variables: {
          thingName,
          shadowName: selectedId === ShadowName.Classic ? null : selectedId
        }
      });
      if (response.errors && response.errors.length > 0) {
        const errorMessage: string = response.errors
          .map((error: GraphQLError): string => error.message)
          .join('\n');
        console.log('GraphQL Errors:', errorMessage);
        setError(errorMessage);
        setShadowData(null);
        return;
      }

      if (response.data?.getThingShadow) {
        setShadowData(JSON.parse(response.data.getThingShadow) as ThingShadow);
      } else {
        setError('Shadow data not found');
      }
    } catch (err: unknown) {
      console.error('Error fetching shadow data:', err);
      const response: GraphQLResult = err as GraphQLResult;
      if (response.errors && Array.isArray(response.errors)) {
        const errorMessage: string = response.errors
          .map((error: GraphQLError): string => error.message)
          .join('\n');
        setError(errorMessage);
      } else {
        setError((err as Error).message || 'An unexpected error occurred');
      }
      setShadowData(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect((): void => {
    fetchShadowData().catch(console.error);
  }, [thingName, selectedId]);

  // Create shadow options with friendly display names
  const shadowOptions: Array<{ id: ShadowName; text: string }> = [
    { id: ShadowName.Classic, text: 'Classic Shadow' },
    { id: ShadowName.State, text: 'State Shadow' },
    { id: ShadowName.Package, text: 'Package Shadow' },
    { id: ShadowName.Schedule, text: 'Schedule Shadow' }
  ];

  return (
    <Container>
      <SpaceBetween size="m">
        <FormField label="Shadows" stretch>
          <SegmentedControl
            selectedId={selectedId}
            onChange={({
              detail: { selectedId }
            }: NonCancelableCustomEvent<SegmentedControlProps.ChangeDetail>): void =>
              setSelectedId(selectedId as ShadowName)
            }
            options={shadowOptions}
          />
        </FormField>
        {loading || error ? (
          <Placeholder
            status={error ? 'error' : 'loading'}
            height={750}
            errorText={error}
          />
        ) : (
          <CodeView
            highlight={jsonHighlight}
            content={JSON.stringify(shadowData, null, 2)}
            lineNumbers
            actions={
              <Button
                iconName="refresh"
                iconAlt="Refresh"
                ariaLabel="Refresh"
                onClick={(): void =>
                  void fetchShadowData().catch(console.error)
                }
              />
            }
          />
        )}
      </SpaceBetween>
    </Container>
  );
};
