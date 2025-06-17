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
