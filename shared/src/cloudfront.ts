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
