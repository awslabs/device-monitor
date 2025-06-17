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
import { Construct } from 'constructs';

export function addNagSuppressions(scope: Construct): void {
  // Add general suppressions for all resources
  NagSuppressions.addResourceSuppressions(
    scope,
    [
      {
        id: 'AwsSolutions-IAM5',
        reason: 'Lambda invocation permissions require ARN:* pattern for AppSync service role',
      },
      {
        id: 'AwsSolutions-L1',
        reason: 'CDK BucketDeployment uses a fixed runtime version that cannot be changed without modifying the CDK library',
      },
      {
        id: 'AwsSolutions-IAM4',
        reason: 'Using AWSLambdaBasicExecutionRole is a best practice for Lambda functions that only need CloudWatch Logs permissions',
      },
      {
        id: 'AwsSolutions-COG3',
        reason: 'Advanced security mode is not required for this prototype application',
      },
      {
        id: 'AwsSolutions-S1',
        reason: 'S3 server access logs are not required for this prototype application',
      },
      {
        id: 'AwsSolutions-CFR1',
        reason: 'Geo restrictions are not required for this prototype application',
      },
      {
        id: 'AwsSolutions-CFR3',
        reason: 'CloudFront access logging is not required for this prototype application',
      },
      {
        id: 'AwsSolutions-CFR4',
        reason: 'TLS configuration will be handled in production environment',
      }
    ],
    true // Apply to all child resources
  );
}

// Add the missing export for backward compatibility
export function suppressCdkNagRules(scope: Construct): void {
  addNagSuppressions(scope);
}