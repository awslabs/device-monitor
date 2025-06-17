import type {
  AsyncHandler,
  JSONObject,
  LambdaInterface
} from '@aws-lambda-powertools/commons/types';
import { Logger } from '@aws-lambda-powertools/logger';
import type {
  LogItemExtraInput,
  LogItemMessage
} from '@aws-lambda-powertools/logger/types';
import { Metrics } from '@aws-lambda-powertools/metrics';
import type { Dimensions } from '@aws-lambda-powertools/metrics/types';
import { Tracer } from '@aws-lambda-powertools/tracer';
import type { Context, Handler } from 'aws-lambda';

const environment: string = process.env.BACON_ENVIRONMENT || 'local';

export const defaultDimensions: Dimensions = {
  region: process.env.AWS_REGION!,
  environment
};

export const logger: Logger = new Logger({
  persistentLogAttributes: {
    ...defaultDimensions
  },
  environment
});

function warnFilter(
  input: LogItemMessage,
  ...extraInput: LogItemExtraInput
): void {
  const message: string = typeof input === 'string' ? input : input.message;
  if (message?.startsWith('No application metrics to publish')) {
    return;
  }
  logger.warn(input, ...extraInput);
}

export const loggerProxy: Logger = new Proxy(logger, {
  get(
    target: Logger,
    prop: keyof Logger,
    receiver?: unknown
  ): (typeof target)[keyof Logger] {
    if (prop === 'warn') {
      return warnFilter;
    }
    return Reflect.get(target, prop, receiver);
  }
});

export const metrics: Metrics = new Metrics({
  defaultDimensions,
  logger: loggerProxy
});

export const tracer: Tracer = new Tracer({
  enabled: false // TODO: Enable tracing
});

export function addMonitoringDetails(
  dimensions: Record<string, string>,
  metadata: Record<string, string> = {}
): void {
  // Logger: Append <key> to each log statement
  logger.appendKeys(dimensions);
  logger.appendKeys(metadata);

  // Tracer: Add <key> as annotation
  for (const [key, value] of Object.entries(dimensions)) {
    tracer.putAnnotation(key, value);
  }
  for (const [key, value] of Object.entries(metadata)) {
    tracer.putMetadata(key, value);
  }

  // Metrics: Add <key> as metadata
  metrics.addDimensions(dimensions);
  for (const [key, value] of Object.entries(metadata)) {
    metrics.addMetadata(key, value);
  }
}

export function logResponse(): (
  target: LambdaInterface,
  propertyKey: keyof LambdaInterface,
  descriptor: TypedPropertyDescriptor<AsyncHandler<Handler>>
) => void {
  return <H extends Handler = Handler<unknown, JSONObject>>(
    target: LambdaInterface,
    propertyKey: keyof LambdaInterface,
    descriptor: TypedPropertyDescriptor<AsyncHandler<H>>
  ): void => {
    const originalMethod: AsyncHandler<H> =
      descriptor?.value || (target[propertyKey] as AsyncHandler<H>);
    descriptor.value = async function (
      event: unknown,
      context: Context
    ): Promise<JSONObject> {
      let response: JSONObject;
      try {
        response = await originalMethod.apply(this, [event, context]);
      } catch (error: unknown) {
        logger.error('Unknown Error', { error });
        throw error;
      }
      logger.info('Response', { response });
      return response;
    };
  };
}
