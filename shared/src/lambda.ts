import type { GetParameterResult } from '@aws-sdk/client-ssm';
import axios, { type AxiosError, type AxiosResponse } from 'axios';
import { type Options, retryAsPromised } from 'retry-as-promised';
import { logger } from './powertools';

export async function getParameterFromExtension<T extends object>(
  name: string
): Promise<T> {
  logger.debug('Getting parameter from extension');
  const response: AxiosResponse<GetParameterResult> = await retryAsPromised(
    (): Promise<AxiosResponse<GetParameterResult>> =>
      axios.get(
        `http://localhost:${process.env.PARAMETERS_SECRETS_EXTENSION_HTTP_PORT}/systemsmanager/parameters/get/?name=${name}`,
        {
          headers: {
            'X-Aws-Parameters-Secrets-Token': process.env.AWS_SESSION_TOKEN!
          }
        }
      ),
    {
      max: 3,
      backoffBase: 0,
      report: (
        message: string,
        _options: Options,
        error?: AxiosError
      ): void => {
        if (error) {
          logger.error(message, {
            error: typeof error === 'string' ? new Error(error) : error,
            body: error.response?.data
          });
        }
      }
    }
  );
  if (!response.data?.Parameter?.Value) {
    logger.error('Could not get parameter value. Malformed response.', {
      parameter: response.data
    });
    throw new Error('Could not get parameter value. Malformed response.');
  }
  let value: T;
  try {
    value = JSON.parse(response.data?.Parameter?.Value);
  } catch (error: unknown) {
    logger.error('Could not parse parameter value', { error });
    throw new Error('Could not parse parameter value');
  }
  logger.debug('Got parameter from extension', { value });
  return value;
}
