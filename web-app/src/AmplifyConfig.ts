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

import { Amplify } from 'aws-amplify';
import type { SharedConfig } from '@bfw/shared/src/types';

export async function initializeAmplify(): Promise<SharedConfig> {
  let config: SharedConfig = {
    userPoolId: import.meta.env.VITE_USERPOOLID,
    userPoolClientId: import.meta.env.VITE_WEBCLIENTID,
    appSyncURL: import.meta.env.VITE_APPSYNCURL,
    region: import.meta.env.VITE_AWSREGION,
    account: import.meta.env.VITE_AWSACCOUNTID
  };

  // Verify required configuration
  if (!config.userPoolId || !config.userPoolClientId) {
    // Fetch config from config.json if env vars not available
    console.log('.env variables not found, fetching from config.json');
    try {
      const response: Response = await fetch('/config.json');
      if (!response.ok) {
        throw new Error(`Failed to fetch config: ${response.statusText}`);
      }
      config = await response.json();
      console.log('Config loaded successfully');
    } catch (error) {
      console.error('Failed to initialize application:', error);
      throw error;
    }
  }
  console.log('Config:', config);
  // Verify required configuration
  if (!config.userPoolId || !config.userPoolClientId) {
    console.error('Missing configuration:', config);
    throw new Error('Required Cognito configuration is missing');
  }
  // Configure Amplify
  Amplify.configure({
    Auth: {
      Cognito: {
        userPoolId: config.userPoolId,
        userPoolClientId: config.userPoolClientId,
        loginWith: {
          email: true,
          username: true,
          phone: false
        }
      }
    },
    API: {
      GraphQL: {
        endpoint: config.appSyncURL,
        region: config.region,
        defaultAuthMode: 'userPool'
      }
    }
  });

  return config;
}
