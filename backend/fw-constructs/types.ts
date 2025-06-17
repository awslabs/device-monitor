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

import * as AppSync from 'aws-cdk-lib/aws-appsync';
import * as Lambda from 'aws-cdk-lib/aws-lambda';
import type Cognito from 'aws-cdk-lib/aws-cognito';

export interface FWConstructProps {
  api: AppSync.GraphqlApi;
  region: string;
  accountId: string;
  userPool?: Cognito.UserPool;
  pythonLayer?: Lambda.LayerVersion;
}

export const defaultAppSyncResponseMapping = `
#if (!$util.isNull($ctx.result.errors))
  #foreach($error in $ctx.result.errors)
    $util.appendError($error.message, $error.type)
  #end
#end
$utils.toJson($ctx.result.data)`;