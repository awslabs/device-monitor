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

import { Construct } from 'constructs';
import * as DynamoDB from 'aws-cdk-lib/aws-dynamodb';
import { RemovalPolicy } from 'aws-cdk-lib/core';

export class UserPreferenceTable extends Construct {
  public readonly table: DynamoDB.Table;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    this.table = new DynamoDB.Table(this, 'UserPreferencesTable', {
      partitionKey: {
        name: 'userID',
        type: DynamoDB.AttributeType.STRING
      },
      billingMode: DynamoDB.BillingMode.PAY_PER_REQUEST,
      // path to production item: remove
      removalPolicy: RemovalPolicy.DESTROY,
      timeToLiveAttribute: 'ttl',
      pointInTimeRecoverySpecification: {
        // Updated to use new property name
        pointInTimeRecoveryEnabled: true
      }
    });
  }
}
