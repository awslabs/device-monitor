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

import { type Construct } from 'constructs';
import { CognitoWebNativeConstruct } from './constructs/cognito-web-native-construct';
import { AppSyncBackendConstruct } from './constructs/appsync-main-construct';
import { CfnOutput, Stack, type StackProps } from 'aws-cdk-lib/core';
import { SsmParameterReaderConstruct } from './constructs/ssm-parameter-reader-construct';
import { CloudFrontS3WebSiteConstruct } from './constructs/cloudfront-s3-website-construct';
import { IoTFleetIndexingConstruct } from './constructs/iot-fleet-indexing-construct';
import { addNagSuppressions } from './cdk-nag-suppressions';

export interface AppStackProps extends StackProps {
  readonly ssmWafArnParameterName: string;
  readonly ssmWafArnParameterRegion: string;
}

export class AppStack extends Stack {
  constructor(scope: Construct, id: string, props: AppStackProps) {
    super(scope, id, props);
    const cognito: CognitoWebNativeConstruct = new CognitoWebNativeConstruct(
      this,
      'Cognito'
    );

    // set in a separate stack since WAF must be created in us-east-1
    const cfWafWebAcl: string = new SsmParameterReaderConstruct(
      this,
      'SsmWafParameter',
      {
        ssmParameterName: props.ssmWafArnParameterName,
        ssmParameterRegion: props.ssmWafArnParameterRegion
      }
    ).getValue();

    // Create IoT Fleet Indexing configuration to enable fleet indexing for device-stats-monitor
    new IoTFleetIndexingConstruct(this, 'IoTFleetIndexing');

    const appSyncBackend: AppSyncBackendConstruct = new AppSyncBackendConstruct(
      this,
      'AppSyncBackend',
      {
        accountId: this.account,
        accountName: 'local', // Using fixed name since we don't need separate account mapping
        region: this.region,
        userPool: cognito.userPool
      }
    );

    // Add CDK-nag suppressions
    addNagSuppressions(this);

    const webapp: CloudFrontS3WebSiteConstruct =
      new CloudFrontS3WebSiteConstruct(this, 'WebApp', {
        userPoolId: cognito.userPool.userPoolId,
        appClientId: cognito.webClientId,
        webAclArn: cfWafWebAcl,
        appSyncURL: appSyncBackend.graphqlUrl
      });
    webapp.node.addDependency(appSyncBackend);

    new CfnOutput(this, 'AWS-ACCOUNT-ID', {
      value: this.account
    });
    new CfnOutput(this, 'APPSYNC-URL', {
      value: appSyncBackend.graphqlUrl
    });
    new CfnOutput(this, 'USER-POOL-ID', {
      value: cognito.userPool.userPoolId
    });
    new CfnOutput(this, 'WEB-CLIENT-ID', {
      value: cognito.webClientId
    });
    new CfnOutput(this, 'AWSREGION', {
      value: this.region
    });
  }
}
