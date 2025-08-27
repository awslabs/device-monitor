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
