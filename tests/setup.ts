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

import 'aws-sdk-client-mock-jest';
import * as fs from 'fs';
import * as path from 'path';

// Read region from web-app/.env file
function getRegionFromEnv(): string {
  try {
    const envPath: string = path.resolve(__dirname, '../web-app/.env');
    if (fs.existsSync(envPath)) {
      const envContent: string = fs.readFileSync(envPath, 'utf8');

      // Look for AWSREGION in the env file
      const lines: string[] = envContent.split('\n');
      for (const line of lines) {
        if (line.startsWith('VITE_AWSREGION=')) {
          return line.substring('VITE_AWSREGION='.length);
        }
      }
    }

    // If we reach here, AWSREGION wasn't found - let test fail
    throw new Error('VITE_AWSREGION not found in .env file');
  } catch (error) {
    console.error('Could not read region from .env file:', error);
    throw error; // Propagate the error so the test fails
  }
}
// Set AWS region from .env file
process.env.AWS_REGION = getRegionFromEnv();
