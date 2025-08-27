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

import { type CodegenConfig } from '@graphql-codegen/cli';

export default {
  schema: [
    './node_modules/amplify-codegen/awsAppSyncDirectives.graphql',
    './shared/src/appsync/schema/schema.graphql'
  ],
  documents: ['./shared/src/appsync/operations/*.graphql'],
  generates: {
    './shared/src/appsync/generated/index.ts': {
      plugins: [
        {
          add: {
            content:
              '/* This is auto generated code. Use `graphql-codegen-esm` to update. */'
          }
        },
        {
          add: {
            content: '/* eslint-disable @typescript-eslint/typedef */'
          }
        },
        {
          add: {
            content: `
export interface Schema {
  query: Query;
  mutation: Mutation;
  subscription: Subscription;
}`,
            placement: 'append'
          }
        },
        'typescript',
        'typescript-operations',
        'typed-document-node'
      ],
      config: {
        allowEnumStringTypes: true,
        avoidOptionals: true,
        defaultScalarType: 'unknown',
        declarationKind: 'interface',
        scalars: {
          AWSDate: 'string',
          AWSDateTime: 'string',
          AWSEmail: 'string',
          AWSIPAddress: 'string',
          AWSJSON: { output: 'string', input: 'unknown' },
          AWSPhone: 'string',
          AWSTime: 'string',
          AWSTimestamp: 'number',
          AWSURL: 'string',
          Double: 'number',
          BigInt: 'number'
        },
        skipTypename: true,
        useTypeImports: true
      }
    }
  },
  hooks: { afterAllFileWrite: ['eslint --fix', 'prettier --write'] }
} satisfies CodegenConfig;
