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
