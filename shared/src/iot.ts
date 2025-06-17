import {
  DescribeCertificateCommand,
  DescribeThingCommand,
  type DescribeThingResponse,
  IoTClient,
  ListThingPrincipalsCommand,
  type ListThingPrincipalsCommandOutput
} from '@aws-sdk/client-iot';
import {
  GetRetainedMessageCommand,
  type GetRetainedMessageCommandOutput,
  GetThingShadowCommand,
  type GetThingShadowCommandOutput,
  IoTDataPlaneClient
} from '@aws-sdk/client-iot-data-plane';
import { logger, tracer } from './powertools';
import type { RawRetainedTopic, ThingShadow } from './types';

import type { RetainedTopicSuffix } from './appsync';

const iotControlClient: IoTClient = tracer.captureAWSv3Client(
  new IoTClient({ region: process.env.AWS_REGION })
);
const iotDataClient: IoTDataPlaneClient = tracer.captureAWSv3Client(
  new IoTDataPlaneClient({ region: process.env.AWS_REGION })
);
const certRegex: RegExp = /.+:cert\//;

export function getIotControlClient(): IoTClient {
  return iotControlClient;
}

export function getIotDataClient(): IoTDataPlaneClient {
  return iotDataClient;
}

export async function describeThing(
  thingName: string
): Promise<DescribeThingResponse> {
  return await iotControlClient.send(
    new DescribeThingCommand({
      thingName
    })
  );
}

export async function getThingShadow<T = ThingShadow>(
  thingName: string,
  shadowName?: string | null
): Promise<T> {
  const { payload }: GetThingShadowCommandOutput = await iotDataClient.send(
    new GetThingShadowCommand({
      thingName,
      shadowName: shadowName === null ? undefined : shadowName
    })
  );
  try {
    return JSON.parse(payload!.transformToString()) as T;
  } catch (error: unknown) {
    logger.error('Could not parse shadow JSON', {
      error,
      thingName,
      shadowName,
      payload: payload ? Buffer.from(payload).toString('base64') : undefined
    });
    throw error;
  }
}

export async function getRetainedTopic(
  thingName: string,
  topicName: RetainedTopicSuffix
): Promise<RawRetainedTopic> {
  const topic: string = `things/${thingName}/topics/${topicName}`;
  const { payload, lastModifiedTime }: GetRetainedMessageCommandOutput =
    await iotDataClient.send(
      new GetRetainedMessageCommand({
        topic
      })
    );
  try {
    return {
      topic,
      payload: JSON.parse(new TextDecoder('utf-8').decode(payload)),
      timestamp: lastModifiedTime || Date.now()
    };
  } catch (error: unknown) {
    logger.error('Could not parse retained message', {
      error,
      thingName,
      topicName,
      payload: payload ? Buffer.from(payload).toString('base64') : undefined
    });
    throw error;
  }
}

export async function getProvisioningTimestamp(
  thingName: string
): Promise<string> {
  logger.debug('Getting provisioning timestamp', { thingName });
  try {
    const { attributes }: DescribeThingResponse =
      await describeThing(thingName);
    if (!attributes?.provisioningTimestamp) {
      throw new Error('Thing does not have provisioning timestamp');
    }
    logger.debug('Got provisioning timestamp for thing', {
      provisioningTimestamp: attributes.provisioningTimestamp
    });
    return attributes.provisioningTimestamp;
  } catch (error: unknown) {
    logger.error('Could not get provisioning timestamp', { error });

    logger.debug('Getting certificate timestamp', { thingName });
    try {
      const output: ListThingPrincipalsCommandOutput =
        await iotControlClient.send(
          new ListThingPrincipalsCommand({
            thingName
          })
        );
      const principalArn: string | undefined = output.principals!.find(
        (principalArn: string): boolean => principalArn.includes(':cert/')
      );
      return new Date(
        (
          await iotControlClient.send(
            new DescribeCertificateCommand({
              certificateId: principalArn!.replace(certRegex, '')
            })
          )
        ).certificateDescription!.creationDate as Date
      ).toISOString();
    } catch (error: unknown) {
      logger.error('Could not get certificate timestamp', { error });
      return new Date().toISOString();
    }
  }
}
