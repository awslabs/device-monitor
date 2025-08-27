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

import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';

export interface CognitoWebNativeConstructProps extends cdk.StackProps {
  readonly appName: string;
  readonly appTitle: string;
  readonly appDomainName: string;
  readonly supportEmail: string;
}

/**
 * Deploys Cognito with an Authenticated Role with a Web client
 */
export class CognitoWebNativeConstruct extends Construct {
  public userPool: cdk.aws_cognito.UserPool;
  public webClientUserPool: cdk.aws_cognito.UserPoolClient;
  public userPoolId: string;
  public webClientId: string;

  public authenticatedRole: cdk.aws_iam.Role;

  constructor(parent: Construct, name: string) {
    super(parent, name);

    const userPool: cdk.aws_cognito.UserPool = new cdk.aws_cognito.UserPool(
      this,
      'UserPool',
      {
        selfSignUpEnabled: false, // Prototype front-ends that are public to the internet should keep this value as false
        autoVerify: { email: true },
        userVerification: {
          emailSubject: 'Verify your email the app!',
          emailBody:
            'Hello {username}, Thanks for signing up to the app! Your verification code is {####}',
          emailStyle: cdk.aws_cognito.VerificationEmailStyle.CODE,
          smsMessage:
            'Hello {username}, Thanks for signing up to app! Your verification code is {####}'
        },
        passwordPolicy: {
          minLength: 8,
          requireDigits: true,
          requireUppercase: true,
          requireSymbols: true,
          requireLowercase: true
        },
        signInAliases: {
          email: true,
          username: true,
          preferredUsername: true
        },
        removalPolicy: cdk.RemovalPolicy.DESTROY,
        mfa: cdk.aws_cognito.Mfa.OPTIONAL, // Enable MFA for security
        mfaSecondFactor: {
          sms: true,
          otp: true
        }
        // Note: advancedSecurityMode requires Cognito Plus plan, removed for cost optimization
      }
    );

    const userPoolWebClient: cdk.aws_cognito.UserPoolClient =
      new cdk.aws_cognito.UserPoolClient(this, 'UserPoolWebClient', {
        generateSecret: false,
        userPool: userPool,
        userPoolClientName: 'WebClient',
        authFlows: {
          userPassword: true,
          userSrp: true,
          custom: true
        }
      });

    const identityPool: cdk.aws_cognito.CfnIdentityPool =
      new cdk.aws_cognito.CfnIdentityPool(this, 'IdentityPool', {
        allowUnauthenticatedIdentities: false,
        cognitoIdentityProviders: [
          {
            clientId: userPoolWebClient.userPoolClientId,
            providerName: userPool.userPoolProviderName
          }
        ]
      });

    const authenticatedRole: cdk.aws_iam.Role = new cdk.aws_iam.Role(
      this,
      'DefaultAuthenticatedRole',
      {
        assumedBy: new cdk.aws_iam.FederatedPrincipal(
          'cognito-identity.amazonaws.com',
          {
            StringEquals: {
              'cognito-identity.amazonaws.com:aud': identityPool.ref
            },
            'ForAnyValue:StringLike': {
              'cognito-identity.amazonaws.com:amr': 'authenticated'
            }
          },
          'sts:AssumeRoleWithWebIdentity'
        )
      }
    );

    new cdk.aws_cognito.CfnIdentityPoolRoleAttachment(
      this,
      'IdentityPoolRoleAttachment',
      {
        identityPoolId: identityPool.ref,
        roles: {
          authenticated: authenticatedRole.roleArn
        }
      }
    );

    // Assign Cfn Outputs
    new cdk.CfnOutput(this, 'UserPoolId', {
      value: userPool.userPoolId
    });
    new cdk.CfnOutput(this, 'IdentityPoolId', {
      value: identityPool.ref
    });
    new cdk.CfnOutput(this, 'WebClientId', {
      value: userPoolWebClient.userPoolClientId
    });

    // Add SSM Parameters
    new cdk.aws_ssm.StringParameter(this, 'COGNITO_USER_POOL_ID', {
      stringValue: userPool.userPoolId
    });

    new cdk.aws_ssm.StringParameter(this, 'COGNITO_IDENTITY_POOL_ID', {
      stringValue: identityPool.ref
    });

    new cdk.aws_ssm.StringParameter(this, 'COGNITO_WEB_CLIENT_ID', {
      stringValue: userPoolWebClient.userPoolClientId
    });

    // assign public properties
    this.userPool = userPool;
    this.webClientUserPool = userPoolWebClient;
    this.authenticatedRole = authenticatedRole;
    this.userPoolId = userPool.userPoolId;
    this.webClientId = userPoolWebClient.userPoolClientId;
  }
}
