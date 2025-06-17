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
import * as AppSync from 'aws-cdk-lib/aws-appsync';
import { type FWConstructProps } from './types';
import type * as DynamoDB from 'aws-cdk-lib/aws-dynamodb';

export class UserPreferenceConstruct extends Construct {
  constructor(
    scope: Construct,
    id: string,
    props: FWConstructProps,
    userPreferencesTable: DynamoDB.ITable
  ) {
    super(scope, id);
    const api: AppSync.GraphqlApi = props.api;

    const userPreferencesDataSource: AppSync.DynamoDbDataSource =
      api.addDynamoDbDataSource(
        'PutUserPreferencesDataSource',
        userPreferencesTable
      );
    userPreferencesDataSource.createResolver('PutUserPreferences', {
      typeName: 'Mutation',
      fieldName: 'putPersistedUserPreferences',
      requestMappingTemplate: AppSync.MappingTemplate.fromString(`
    #set($input = $ctx.args.input)
    {
      "version" : "2017-02-28",
      "operation": "PutItem",
      "key": {
        "userID": $util.dynamodb.toDynamoDBJson($context.identity.username)
      },
      "attributeValues": $util.dynamodb.toMapValuesJson($input)
    }
          `),
      responseMappingTemplate: AppSync.MappingTemplate.dynamoDbResultItem()
    });
    userPreferencesDataSource.createResolver('GetUserPreferences', {
      typeName: 'Query',
      fieldName: 'getPersistedUserPreferences',
      requestMappingTemplate: AppSync.MappingTemplate.fromString(`
    {
        "version": "2017-02-28",
        "operation": "GetItem",
        "key": {
            "userID": $util.dynamodb.toDynamoDBJson($context.identity.username)
        },
        "consistentRead": true
    }
          `),
      responseMappingTemplate: AppSync.MappingTemplate.dynamoDbResultItem()
    });
  }
}
