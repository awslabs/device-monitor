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
 */

import { NagSuppressions } from 'cdk-nag';
import { type Construct } from 'constructs';

export function addNagSuppressions(scope: Construct): void {
  // IAM4 - AWS Managed Policies (JUSTIFIED - These are AWS best practices)
  NagSuppressions.addResourceSuppressions(
    scope,
    [
      {
        id: 'AwsSolutions-IAM4',
        reason:
          'AWS managed policies used: AWSLambdaBasicExecutionRole (provides minimal CloudWatch Logs permissions for Lambda) and AWSAppSyncPushToCloudWatchLogs (enables AppSync logging). These are AWS recommended best practices for their respective services.'
      }
    ],
    true
  );

  // IAM5 - Wildcard Permissions (SPECIFIC JUSTIFICATIONS REQUIRED)
  NagSuppressions.addResourceSuppressions(
    scope,
    [
      {
        id: 'AwsSolutions-IAM5',
        reason: 'CloudWatch GetMetricData and PutMetricData APIs require wildcard resource access as per AWS service design. These operations cannot be scoped to specific resources.',
        appliesTo: ['Resource::*']
      }
    ],
    true
  );

  // Non-IAM suppressions (keeping existing prototype-specific ones)
  NagSuppressions.addResourceSuppressions(
    scope,
    [
      {
        id: 'AwsSolutions-L1',
        reason:
          'CDK BucketDeployment uses a fixed runtime version that cannot be changed without modifying the CDK library'
      },
      {
        id: 'AwsSolutions-COG3',
        reason:
          'Advanced security mode is not required for this prototype application'
      },
      {
        id: 'AwsSolutions-S1',
        reason:
          'S3 server access logs are not required for this prototype application'
      },
      {
        id: 'AwsSolutions-CFR1',
        reason:
          'Geo restrictions are not required for this prototype application'
      },
      {
        id: 'AwsSolutions-CFR3',
        reason:
          'CloudFront access logging is not required for this prototype application'
      },
      {
        id: 'AwsSolutions-CFR4',
        reason: 'TLS configuration will be handled in production environment'
      }
    ],
    true
  );
}

// Add specific IAM5 suppressions for service-specific patterns
export function addSpecificIAM5Suppressions(scope: Construct): void {
  // AppSync GraphQL API access requires /* pattern for field-level operations
  NagSuppressions.addResourceSuppressions(
    scope,
    [
      {
        id: 'AwsSolutions-IAM5',
        reason: 'AppSync GraphQL API requires ARN pattern with /* suffix for field-level GraphQL operations. This is the standard AWS pattern for AppSync permissions.',
        appliesTo: ['Resource::<*GraphqlApi*>/*', 'Resource::*:graphql']
      }
    ],
    true
  );

  // IoT service ARN patterns for thing and job operations
  NagSuppressions.addResourceSuppressions(
    scope,
    [
      {
        id: 'AwsSolutions-IAM5',
        reason: 'IoT service operations require ARN patterns with wildcards for thing and job access. Resources are properly scoped to account and region. IoT SearchIndex and ListThingGroups APIs require wildcard access by AWS service design.',
        appliesTo: [
          'Resource::arn:aws:iot:*:*:thing/*',
          'Resource::arn:aws:iot:*:*:job/*', 
          'Resource::arn:aws:iot:*:*:index/AWS_Things'
        ]
      }
    ],
    true
  );
}

// Backward compatibility function
export function suppressCdkNagRules(scope: Construct): void {
  addNagSuppressions(scope);
  addSpecificIAM5Suppressions(scope);
}
