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
/* eslint-disable */

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function generateEnvFile() {
  // Try to read cdk-outputs.json
  const cdkOutputsPath = join(
    dirname(__dirname),
    'backend',
    'cdk-outputs.json'
  );
  // Define web-app path
  const webAppPath = join(dirname(__dirname), 'web-app', '.env');

  try {
    console.log('Reading CDK outputs from:', cdkOutputsPath);
    const cdkOutputs = JSON.parse(readFileSync(cdkOutputsPath, 'utf-8'));
    console.log('CDK outputs:', JSON.stringify(cdkOutputs, null, 2));

    // Get the first stack name from the outputs
    const stackName = Object.keys(cdkOutputs)[0];
    console.log('Stack name:', stackName);

    // Create environment variables matching exactly the expected names
    const envVars = {
      VITE_USERPOOLID: cdkOutputs[stackName].USERPOOLID,
      VITE_WEBCLIENTID: cdkOutputs[stackName].WEBCLIENTID,
      VITE_APPSYNCURL: cdkOutputs[stackName].APPSYNCURL,
      VITE_AWSACCOUNTID: cdkOutputs[stackName].AWSACCOUNTID,
      VITE_AWSREGION: cdkOutputs[stackName].AWSREGION
    };

    console.log('Environment variables:', envVars);

    const envContent = Object.entries(envVars)
      .filter(([_, value]) => value !== undefined)
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');

    console.log('Writing to file:', webAppPath);
    console.log('Content to write:', envContent);

    writeFileSync(webAppPath, envContent);
    console.log('Successfully created .env file in web-app folder');
  } catch (error) {
    console.error('Error generating .env file:', error);
    console.error('Make sure you have run "cdk deploy" first');
    process.exit(1);
  }
}

generateEnvFile();
