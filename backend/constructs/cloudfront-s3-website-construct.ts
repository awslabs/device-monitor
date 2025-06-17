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

import CloudFront from 'aws-cdk-lib/aws-cloudfront';
import CloudFrontOrigins from 'aws-cdk-lib/aws-cloudfront-origins';
import IAM from 'aws-cdk-lib/aws-iam';
import S3 from 'aws-cdk-lib/aws-s3';
import {
  AssetHashType,
  CfnOutput,
  DockerImage,
  Duration,
  RemovalPolicy,
  Stack,
  type StackProps
} from 'aws-cdk-lib/core';
import { Construct } from 'constructs';
import { spawnSync } from 'child_process';
import path from 'path';
import S3Deployment from 'aws-cdk-lib/aws-s3-deployment';
import type { SharedConfig } from '@bfw/shared/src/types';

export interface CloudFrontS3WebSiteConstructProps extends StackProps {
  /**
   * The path to the source assets directory of the website, relative to this construct
   * ex: "../../../app"
   *
   * NB: By default the construct will attempt to build the assets from the source.
   *     If you want to use an already built assets directory, then set the "webSiteBuildPath" property
   *
   * NB: If this path is NOT specified, a default construct-relative path for standard foundations
   *     serverless v2 blueprints will be used.
   */
  readonly webSiteSourcePath?: string;

  /**
   * The path to the pre-built assets directory of the website, relative to the project root
   * ex: "./app/dist"
   *
   * NB: If this path is NOT specified, the construct will attempt to build the assets from the source.
   */
  readonly webSiteBuildPath?: string;

  /**
   * The Arn of the WafV2 WebAcl.
   */
  readonly webAclArn?: string;
  /**
   * The Cognito UserPoolId to authenticate users in the front-end
   */
  readonly userPoolId: string;

  /**
   * The Cognito AppClientId to authenticate users in the front-end
   */
  readonly appClientId: string;

  /**
   * The Cognito IdentityPoolId to authenticate users in the front-end
   */
  // readonly identityPoolId: string;

  readonly appSyncURL: string;
}

const defaultProps: Partial<CloudFrontS3WebSiteConstructProps> = {};

/**
 * Deploys a CloudFront Distribution pointing to an S3 bucket containing the deployed web application {webSiteBuildPath}.
 * Creates:
 * - S3 bucket
 * - CloudFrontDistribution
 * - OriginAccessIdentity
 *
 * On redeployment, will automatically invalidate the CloudFront distribution cache
 */
export class CloudFrontS3WebSiteConstruct extends Construct {
  /**
   * The cloud front distribution to attach additional behaviors like `/api`
   */
  public cloudFrontDistribution: CloudFront.Distribution;

  /**
   * The name of the bucket where the frontend assets are stored
   */
  public siteBucket: S3.Bucket;

  constructor(
    parent: Construct,
    name: string,
    props: CloudFrontS3WebSiteConstructProps
  ) {
    super(parent, name);

    props = { ...defaultProps, ...props };
    const stack: Stack = Stack.of(this);

    // When using Distribution, do not set the s3 bucket website documents
    // if these are set then the distribution origin is configured for HTTP communication with the
    // s3 bucket and won't configure the cloudformation correctly.
    this.siteBucket = new S3.Bucket(this, 'WebApp', {
      encryption: S3.BucketEncryption.S3_MANAGED,
      autoDeleteObjects: true,
      blockPublicAccess: S3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: RemovalPolicy.DESTROY,
      enforceSSL: true
    });

    this.siteBucket.addToResourcePolicy(
      new IAM.PolicyStatement({
        sid: 'EnforceTLS',
        effect: IAM.Effect.DENY,
        principals: [new IAM.AnyPrincipal()],
        actions: ['s3:*'],
        resources: [
          this.siteBucket.bucketArn,
          this.siteBucket.bucketArn + '/*'
        ],
        conditions: { Bool: { 'aws:SecureTransport': 'false' } }
      })
    );

    const s3origin: CloudFront.IOrigin =
      CloudFrontOrigins.S3BucketOrigin.withOriginAccessControl(
        this.siteBucket,
        {
          originAccessLevels: [CloudFront.AccessLevel.READ]
        }
      );

    const cloudFrontDistribution: CloudFront.Distribution =
      new CloudFront.Distribution(this, 'WebAppDistribution', {
        defaultBehavior: {
          origin: s3origin,
          cachePolicy: new CloudFront.CachePolicy(this, 'CachePolicy', {
            defaultTtl: Duration.hours(1)
          }),
          allowedMethods: CloudFront.AllowedMethods.ALLOW_ALL,
          viewerProtocolPolicy: CloudFront.ViewerProtocolPolicy.HTTPS_ONLY
        },
        errorResponses: [
          {
            httpStatus: 404,
            ttl: Duration.hours(0),
            responseHttpStatus: 200,
            responsePagePath: '/index.html'
          },
          {
            httpStatus: 403,
            ttl: Duration.hours(0),
            responseHttpStatus: 200,
            responsePagePath: '/index.html'
          }
        ],
        defaultRootObject: 'index.html',
        webAclId: props.webAclArn,
        minimumProtocolVersion: CloudFront.SecurityPolicyProtocol.TLS_V1_2_2021 // Required by security
      });

    const webappConfig: SharedConfig = {
      userPoolId: props.userPoolId,
      userPoolClientId: props.appClientId,
      appSyncURL: props.appSyncURL,
      region: stack.region,
      account: stack.account
    };

    // default of 128MiB isn't large enough for larger website deployments. More memory doesn't improve the performance.
    // You want just enough memory to guarantee deployment
    const memoryLimit: number = 512;
    new S3Deployment.BucketDeployment(this, 'DeployWithInvalidation', {
      sources: [
        props.webSiteBuildPath
          ? // Main webapp from root directory (pre-built)
            S3Deployment.Source.asset(props.webSiteBuildPath)
          : // Main webapp from root directory (built locally as part of deployment)
            S3Deployment.Source.asset(
              path.join(import.meta.dirname, '../../web-app'),
              {
                assetHashType: AssetHashType.OUTPUT,
                bundling: {
                  image: DockerImage.fromRegistry('node:lts'),
                  command: [],
                  local: {
                    tryBundle(outputDir: string): boolean {
                      try {
                        spawnSync('npm --version');
                      } catch {
                        return false;
                      }
                      // Use path relative to the current file
                      const rootDir: string = path.resolve(import.meta.dirname, '../..');
                      spawnSync(
                        [
                          'pwd',
                          `cd ${rootDir}/web-app`,
                          // originally 'npm ci'
                          'npm i',
                          `npm run build -- --emptyOutDir --outDir ${outputDir}`
                        ].join(' && '),
                        {
                          shell: true, // required to be true (for build to work)
                          stdio: 'inherit'
                        }
                      );

                      return true;
                    }
                  }
                }
              }
            ),
        S3Deployment.Source.jsonData('config.json', webappConfig) // Amplify config file
      ],
      destinationBucket: this.siteBucket,
      distribution: cloudFrontDistribution, // this assignment, on redeploy, will automatically invalidate the cloudfront cache
      distributionPaths: ['/*'],
      // default of 128 isn't large enough for larger website deployments. More memory doesn't improve the performance.
      // You want just enough memory to guarantee deployment
      memoryLimit
    });

    // export any cf outputs
    new CfnOutput(this, 'SiteBucket', {
      value: this.siteBucket.bucketName
    });
    new CfnOutput(this, 'CloudFrontDistributionId', {
      value: cloudFrontDistribution.distributionId
    });
    new CfnOutput(this, 'CloudFrontDistributionDomainName', {
      value: cloudFrontDistribution.distributionDomainName
    });
    new CfnOutput(this, 'CloudFrontDistributionUrl', {
      value: `https://${cloudFrontDistribution.distributionDomainName}`
    });

    // assign public properties
    this.cloudFrontDistribution = cloudFrontDistribution;
  }
}
