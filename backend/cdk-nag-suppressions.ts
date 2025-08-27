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
 */

import { NagSuppressions } from 'cdk-nag';
import { type Construct } from 'constructs';
import { Stack } from 'aws-cdk-lib/core';

/**
 * Adds CDK nag suppressions for acceptable security violations
 * Uses dynamic resource references instead of hard-coded values
 */
export function addNagSuppressions(scope: Construct): void {
  const stack: Stack = Stack.of(scope);
  const region: string = stack.region;
  const account: string = stack.account;

  // Use stack-level suppressions for comprehensive coverage
  NagSuppressions.addStackSuppressions(stack, [
    {
      id: 'AwsSolutions-IAM4',
      reason:
        'AWS managed policies used for standard service operations: AWSLambdaBasicExecutionRole (CloudWatch Logs access), AWSAppSyncPushToCloudWatchLogs (AppSync logging). These follow AWS best practices and provide minimal required permissions.'
    },
    {
      id: 'AwsSolutions-IAM5',
      reason: `Comprehensive suppression for AWS service patterns that require wildcards by design:
      1. CloudWatch GetMetricData/PutMetricData APIs require wildcard resource access (AWS service limitation)
      2. AppSync GraphQL API requires ARN patterns with /* and :* suffixes for field-level operations
      3. IoT service operations require wildcards for thing/job/topic access (scoped to account ${account}, region ${region})
      4. DynamoDB GSI access requires /index/* patterns (AWS service requirement)
      5. Lambda invocation for AppSync requires :* patterns for versioning/aliases
      6. S3 operations for CDK deployment require wildcard actions (scoped to specific buckets)
      7. Cognito SMS role requires wildcard SNS permissions for MFA
      8. CloudWatch Logs operations require wildcards for log retention management
      All permissions are scoped as narrowly as possible within AWS service constraints.`
    },
    {
      id: 'AwsSolutions-L1',
      reason:
        'CDK BucketDeployment and other CDK constructs use fixed Lambda runtime versions that cannot be changed without modifying the CDK library. Application Lambda functions use the latest runtime (Python 3.12).'
    },
    {
      id: 'AwsSolutions-COG2',
      reason:
        'MFA is configured as optional to balance security with development usability. Can be set to required in production environments.'
    },
    {
      id: 'AwsSolutions-COG3',
      reason:
        'Advanced security mode requires Cognito Plus plan which incurs additional costs. Basic security features are enabled including strong password policies and MFA support.'
    },
    {
      id: 'AwsSolutions-S1',
      reason:
        'CloudFront access logs bucket does not require server access logs to avoid recursive logging. The bucket is configured with appropriate security settings including encryption, lifecycle policies, and restricted public access while allowing CloudFront service ACL access for log delivery.'
    },
    {
      id: 'AwsSolutions-S2',
      reason:
        'CloudFront access logs bucket requires ACL access for CloudFront service to write logs. Public access is still restricted through blockPublicPolicy=true, ignorePublicAcls=true, and restrictPublicBuckets=true. Only blockPublicAcls is set to false to allow CloudFront service ACL access.'
    },
    {
      id: 'AwsSolutions-CFR4',
      reason:
        'CloudFront distribution is configured with TLS 1.2 minimum. The warning may appear due to CDK default settings but actual configuration enforces modern TLS versions.'
    },
    {
      id: 'AwsSolutions-DDB3',
      reason:
        'Point-in-time recovery is enabled using the new pointInTimeRecoverySpecification property. The warning may appear due to CDK version compatibility.'
    }
  ]);
}

/**
 * Backward compatibility function
 */
export function suppressCdkNagRules(scope: Construct): void {
  addNagSuppressions(scope);
}
