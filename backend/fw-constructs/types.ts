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

import type * as AppSync from 'aws-cdk-lib/aws-appsync';
import type * as Lambda from 'aws-cdk-lib/aws-lambda';
import type Cognito from 'aws-cdk-lib/aws-cognito';

export interface FWConstructProps {
  api: AppSync.GraphqlApi;
  region: string;
  accountId: string;
  userPool?: Cognito.UserPool;
  pythonLayer?: Lambda.LayerVersion;
}

export const defaultAppSyncResponseMapping: string = `
#if (!$util.isNull($ctx.result.errors))
  #foreach($error in $ctx.result.errors)
    $util.appendError($error.message, $error.type)
  #end
#end
$utils.toJson($ctx.result.data)`;
