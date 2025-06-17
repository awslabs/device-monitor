import type {
  GraphQLOperationType,
  GraphQLQuery
} from '@aws-amplify/api-graphql';

export type AmplifyQuery<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Variables extends Record<string, any>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Result extends Record<string, any>
> = GraphQLOperationType<Variables, Result> & GraphQLQuery<Result>;
