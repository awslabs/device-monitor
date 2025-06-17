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

import react from '@vitejs/plugin-react-swc';
import { type ConfigEnv, defineConfig, loadEnv, type UserConfig } from 'vite';
import { type GetManualChunk } from 'rollup';

// https://vitejs.dev/config/
export default defineConfig(({ mode }: ConfigEnv): UserConfig => {
  process.env = { ...process.env, ...loadEnv(mode, process.cwd()) };
  return {
    plugins: [react()],
    build: {
      rollupOptions: {
        output: {
          manualChunks(id: string): ReturnType<GetManualChunk> {
            if (id.includes('@cloudscape-design/components/i18n')) {
              return 'vendors.cloudscape.i18n';
            }
            if (id.includes('@cloudscape')) {
              return 'vendors.cloudscape';
            }
            if (id.includes('@aws-amplify')) {
              return 'vendors.aws-amplify';
            }
            if (id.includes('@aws') || id.includes('amazon-cognito-identity')) {
              return 'vendors.aws';
            }
            return undefined;
          }
        }
      }
    },
    resolve: {
      alias: [
        {
          find: './runtimeConfig',
          replacement: './runtimeConfig.browser' // ensures browser compatible version of AWS JS SDK is used
        }
      ]
    },
    server: {
      proxy: {
        '/config.json': {
          target: process.env.VITE_CLOUDFRONT_URL,
          changeOrigin: true,
          secure: false
        },
        '/api': {
          target: process.env.VITE_CLOUDFRONT_URL,
          changeOrigin: true,
          secure: false
        }
      }
    }
  };
});
