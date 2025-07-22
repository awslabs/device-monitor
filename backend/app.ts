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

import { AppStack } from './app-stack';
import { AwsSolutionsChecks } from 'cdk-nag';
import { suppressCdkNagRules } from './cdk-nag-suppressions';
import { getConfigProvider } from './config/index';
import type { GitContext } from './config/git-context';
import { App, Aspects } from 'aws-cdk-lib/core';
import { CfWafStack } from './cf-waf-stack';

const gitContext: GitContext = getConfigProvider('git')();
const app: App = new App();

const stackName: string = `FleetWatch-${app.node.tryGetContext('stack_name') || gitContext.appStackName}`;

// Comment out to force stack name
if (!process.env.GITHUB_ACTIONS && stackName === 'main') {
  throw new Error('Stack name "main" is not allowed outside of GitHub Actions');
}
const account: string =
  app.node.tryGetContext('account') ||
  process.env.CDK_DEPLOY_ACCOUNT ||
  process.env.CDK_DEFAULT_ACCOUNT;
const region: string =
  app.node.tryGetContext('region') ||
  process.env.CDK_DEPLOY_REGION ||
  process.env.CDK_DEFAULT_REGION;

const cfWafStackName: string = stackName + '-waf';
const cfWafStack: CfWafStack = new CfWafStack(app, cfWafStackName, {
  env: {
    account,
    region: 'us-east-1'
  },
  stackName: cfWafStackName
});

// Deploy App Stack
const appStack: AppStack = new AppStack(app, stackName, {
  env: {
    account,
    region
  },
  stackName,
  ssmWafArnParameterName: cfWafStack.ssmWafArnParameterName,
  ssmWafArnParameterRegion: cfWafStack.region
});

appStack.addDependency(cfWafStack);

// Add Aws Solutions Checks and apply suppressions for acceptable violations
Aspects.of(app).add(new AwsSolutionsChecks({ logIgnores: true }));
suppressCdkNagRules(cfWafStack);
suppressCdkNagRules(appStack);

app.synth();
