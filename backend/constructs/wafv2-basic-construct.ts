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

import WAFv2 from 'aws-cdk-lib/aws-wafv2';
import type { IResolvable, StackProps } from 'aws-cdk-lib/core';
import { Construct } from 'constructs';

/**
 * defines the scope for the WebACL
 * Cloudfront - for cloud front for cloud front distributions
 * Regional - for load balancers and api gateway's
 */
export enum WafV2Scope {
  /**
   * for cloudfront distributions
   */
  CLOUDFRONT = 'CLOUDFRONT',
  /**
   * for api gateways, loadbalancers and other supported resources
   */
  REGIONAL = 'REGIONAL'
}

export interface Wafv2BasicConstructProps extends StackProps {
  /**
   * The ACL scope.
   */
  readonly wafScope: WafV2Scope;

  /**
   * Optional rules for the firewall
   */
  readonly rules?:
    | Array<WAFv2.CfnWebACL.RuleProperty | IResolvable>
    | IResolvable;

  /**
   * The region where the WAF will be deployed
   */
  readonly region?: string;
}

/**
 * Default input properties
 */
const defaultProps: Partial<Wafv2BasicConstructProps> = {
  region: 'us-east-1'
};

/**
 * Deploys a basic WAFv2 ACL that is open by default
 */
export class Wafv2BasicConstruct extends Construct {
  public webacl: WAFv2.CfnWebACL;

  constructor(
    parent: Construct,
    name: string,
    props: Wafv2BasicConstructProps
  ) {
    super(parent, name);
    props = { ...defaultProps, ...props };

    const wafScopeString: string = props.wafScope.toString();

    if (
      props.wafScope === WafV2Scope.CLOUDFRONT &&
      props.region !== 'us-east-1'
    ) {
      throw new Error(
        'Only supported region for WAFv2 scope when set to CLOUDFRONT is us-east-1. ' +
          'see - https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-wafv2-webacl.html'
      );
    }

    const webacl: WAFv2.CfnWebACL = new WAFv2.CfnWebACL(this, 'webacl', {
      description: 'Basic waf',
      defaultAction: {
        allow: {} // allow everything by default
      },
      rules: props.rules,
      scope: wafScopeString,
      visibilityConfig: {
        cloudWatchMetricsEnabled: true,
        metricName: 'WAFACLGlobal',
        sampledRequestsEnabled: true
      }
    });

    this.webacl = webacl;
  }
}
