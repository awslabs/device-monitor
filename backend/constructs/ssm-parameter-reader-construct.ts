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

import { Stack, type StackProps } from 'aws-cdk-lib/core';
import {
  AwsCustomResource,
  AwsCustomResourcePolicy,
  PhysicalResourceId
} from 'aws-cdk-lib/custom-resources';
import { Construct } from 'constructs';

export interface SsmParameterReaderConstructProps extends StackProps {
  readonly ssmParameterName: string;
  readonly ssmParameterRegion: string;
  /**
   * Sets the physical resource id to current date to force a pull of the parameter on subsequent
   * deploys
   *
   * @default false
   */
  readonly pullEveryTime?: boolean;
  readonly installLatestAwsSdk?: boolean;
}

const defaultProps: Partial<SsmParameterReaderConstructProps> = {
  pullEveryTime: false,
  installLatestAwsSdk: false
};

/**
 * Deploys the SsmParameterReaderConstruct construct
 *
 * Reads an inter / intra region parameter by name.
 *
 */
export class SsmParameterReaderConstruct extends Construct {
  public ssmParameter: AwsCustomResource;

  constructor(
    parent: Construct,
    name: string,
    props: SsmParameterReaderConstructProps
  ) {
    super(parent, name);

    props = { ...defaultProps, ...props };

    const stack: Stack = Stack.of(this);

    const physicalResourceId: string = props.pullEveryTime
      ? Date.UTC.toString()
      : `${props.ssmParameterName}-${props.ssmParameterRegion}`;

    this.ssmParameter = new AwsCustomResource(this, 'Param', {
      onUpdate: {
        service: 'SSM',
        action: 'getParameter',
        parameters: { Name: props.ssmParameterName },
        region: props.ssmParameterRegion,
        physicalResourceId: PhysicalResourceId.of(physicalResourceId)
      },
      installLatestAwsSdk: props.installLatestAwsSdk,
      policy: AwsCustomResourcePolicy.fromSdkCalls({
        resources: [
          `arn:aws:ssm:${props.ssmParameterRegion}:${stack.account}:parameter/${props.ssmParameterName}`
        ]
      })
    });
  }

  /**
   * @returns string value of the parameter
   */
  public getValue(): string {
    return this.ssmParameter.getResponseField('Parameter.Value');
  }
}
