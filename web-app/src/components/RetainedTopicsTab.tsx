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
import { CodeView } from '@cloudscape-design/code-view';
import jsonHighlight from '@cloudscape-design/code-view/highlight/json';
import {
  GetRetainedTopicDocument,
  RetainedTopicSuffix,
  type GetRetainedTopicQuery,
  type GetRetainedTopicQueryVariables
} from '@bfw/shared/src/appsync';
import { client } from '../config/appsync-config';
import type {
  GenericReactState,
  RawRetainedTopic
} from '@bfw/shared/src/types';
import type { GraphQLResult } from '@aws-amplify/api-graphql';
import type { GraphQLError } from 'graphql/error/GraphQLError';
import Container from '@cloudscape-design/components/container';
import SpaceBetween from '@cloudscape-design/components/space-between';
import FormField from '@cloudscape-design/components/form-field';
import SegmentedControl, {
  type SegmentedControlProps
} from '@cloudscape-design/components/segmented-control';
import type { NonCancelableCustomEvent } from '@cloudscape-design/components/interfaces';
import Placeholder from './Placeholder';
import Button from '@cloudscape-design/components/button';
import type { AmplifyQuery } from '../utils/AmplifyQuery';

export interface RetainedTopicsTabProps {
  thingName: string;
}

export const RetainedTopicsTab: FunctionComponent<RetainedTopicsTabProps> = ({
  thingName
}: RetainedTopicsTabProps): ReactElement => {
  const [selectedId, setSelectedId]: GenericReactState<RetainedTopicSuffix> =
    useState<RetainedTopicSuffix>(RetainedTopicSuffix.Info);
  const [loading, setLoading]: GenericReactState<boolean> = useState(true);
  const [error, setError]: GenericReactState<string | undefined> = useState<
    string | undefined
  >(undefined);
  const [topicData, setTopicData]: GenericReactState<RawRetainedTopic | null> =
    useState<RawRetainedTopic | null>(null);

  async function fetchRetainedTopics(): Promise<void> {
    try {
      setLoading(true);
      setError(undefined);

      const response: GraphQLResult<GetRetainedTopicQuery> =
        await client.graphql<
          AmplifyQuery<GetRetainedTopicQueryVariables, GetRetainedTopicQuery>
        >({
          query: GetRetainedTopicDocument,
          variables: {
            thingName,
            topicName: selectedId
          }
        });

      if (response.errors && response.errors.length > 0) {
        const errorMessage: string = response.errors
          .map((error: GraphQLError): string => error.message)
          .join('\n');
        console.log('GraphQL Errors:', errorMessage);
        setError(errorMessage);
        setTopicData(null);
        return;
      }

      if (response.data?.getRetainedTopic) {
        setTopicData(
          JSON.parse(response.data.getRetainedTopic.payload) as RawRetainedTopic
        );
      } else {
        setError('No retained topics found');
      }
    } catch (err: unknown) {
      console.error('Error fetching retained topics:', err);
      const response: GraphQLResult = err as GraphQLResult;
      if (response.errors && Array.isArray(response.errors)) {
        const errorMessage: string = response.errors
          .map((error: GraphQLError): string => error.message)
          .join('\n');
        setError(errorMessage);
      } else {
        setError((err as Error).message || 'An unexpected error occurred');
      }
      setTopicData(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect((): void => {
    fetchRetainedTopics().catch(console.error);
  }, [thingName, selectedId]);

  return (
    <Container>
      <SpaceBetween size="m">
        <FormField label="Topics" stretch>
          <SegmentedControl
            selectedId={selectedId}
            onChange={({
              detail: { selectedId }
            }: NonCancelableCustomEvent<SegmentedControlProps.ChangeDetail>): void =>
              setSelectedId(selectedId as RetainedTopicSuffix)
            }
            options={Object.entries(RetainedTopicSuffix).map(
              ([text, id]: [string, string]): SegmentedControlProps.Option => ({
                id,
                text
              })
            )}
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
            content={JSON.stringify(topicData, null, 2)}
            lineNumbers
            actions={
              <Button
                iconName="refresh"
                iconAlt="Refresh"
                ariaLabel="Refresh"
                onClick={(): void =>
                  void fetchRetainedTopics().catch(console.error)
                }
              />
            }
          />
        )}
      </SpaceBetween>
    </Container>
  );
};
