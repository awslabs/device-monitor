/**
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import {
  CloudFrontClient,
  CreateInvalidationCommand
} from '@aws-sdk/client-cloudfront';
import { logger, tracer } from './powertools';

const cloudFrontClient: CloudFrontClient = tracer.captureAWSv3Client(
  new CloudFrontClient({
    region: process.env.AWS_REGION
  })
);

export function getCloudFrontClient(): CloudFrontClient {
  return cloudFrontClient;
}

export async function invalidateCache(Items: Array<string>): Promise<void> {
  try {
    await cloudFrontClient.send(
      new CreateInvalidationCommand({
        DistributionId: process.env.CLOUDFRONT_DISTRIBUTION_ID,
        InvalidationBatch: {
          CallerReference: new Date().toISOString(),
          Paths: {
            Quantity: Items.length,
            Items
          }
        }
      })
    );
  } catch (error: unknown) {
    logger.error('Failed to invalidate cache', { error });
  }
}
