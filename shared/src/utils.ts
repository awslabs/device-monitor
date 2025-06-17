import type { AppSyncResolverEvent, Context } from 'aws-lambda';
import {
  FilterOperator,
  type FilterInput,
  type FilterResolverInput
} from './appsync';
import type { AppSyncResolverError, AppSyncResolverResponse } from './types';

export function getRegionShorthand(region: string): string {
  const direction: string | undefined = {
    central: 'c',
    east: 'e',
    north: 'n',
    northeast: 'ne',
    northwest: 'nw',
    south: 's',
    southeast: 'se',
    southwest: 'sw',
    west: 'w'
  }[region.slice(3, -2)];
  if (!direction) {
    throw new Error('Invalid region');
  }
  return `${region.slice(0, 2)}${direction}${region.slice(-1)}`;
}

export function parseJsonAsync<T>(json: string): Promise<T> {
  return new Promise((resolve: (result: T) => void): void =>
    resolve(JSON.parse(json) as T)
  );
}

export function parseJsonNoThrow<R, F = undefined>(
  json: string,
  fallback: unknown = undefined
): R | F {
  try {
    return JSON.parse(json) as R;
  } catch (error: unknown) {
    console.warn('Failed to parse JSON', { error });
    return fallback as F;
  }
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve: () => void): void => {
    setTimeout(resolve, ms);
  });
}

export function* chunkArray<T>(
  arr: Array<T>,
  size: number
): Generator<Array<T>, void> {
  for (let i: number = 0; i < arr.length; i += size) {
    yield arr.slice(i, i + size);
  }
}

export function noop(): void {
  // no-op
}

export function createAppSyncError(
  error: unknown
): AppSyncResolverResponse<never> {
  if (error instanceof AggregateError) {
    return {
      errors: error.errors.map(
        (err: Error): AppSyncResolverError => ({
          message: err.message,
          type: err.name
        })
      )
    };
  } else if (error instanceof Error) {
    return {
      errors: [
        {
          message: error.message,
          type: error.name
        }
      ]
    };
  }
  return {
    errors: [
      {
        message: typeof error === 'string' ? error : 'Unknown error',
        type: 'UnknownError'
      }
    ]
  };
}

function constructQueryString({
  fieldName,
  operator,
  value
}: FilterInput): string {
  const operatorMapping: Record<FilterOperator, string> = {
    [FilterOperator.None]: '',
    [FilterOperator.Eq]: ':',
    [FilterOperator.Ne]: ':',
    [FilterOperator.Le]: '<=',
    [FilterOperator.Lt]: '<',
    [FilterOperator.Ge]: '>=',
    [FilterOperator.Gt]: '>',
    [FilterOperator.Between]: ':',
    [FilterOperator.Contains]: ':'
  };

  if (
    operator === FilterOperator.Between &&
    Array.isArray(value) &&
    value.length === 2
  ) {
    return `${fieldName} ${operatorMapping[operator]} [${value[0]} TO ${value[1]}]`;
  } else if (
    operator !== FilterOperator.Between &&
    value != null &&
    typeof value !== 'object'
  ) {
    return `${operator === FilterOperator.Ne ? 'NOT ' : ''}${fieldName || ''}${operatorMapping[operator] || ''}${value}${operator === FilterOperator.Contains ? '*' : ''}`;
  } else {
    throw new Error('Invalid filter');
  }
}

export function concatFilters(
  filterResolverInput: FilterResolverInput | null
): string {
  let isFilteredToFavorites: boolean = false;
  const filtersWithoutFavorites: Array<FilterInput> =
    filterResolverInput?.filters?.filter(
      (filterInput: FilterInput): boolean => {
        if (filterInput.fieldName === 'favorite') {
          isFilteredToFavorites = true;
          return false;
        }
        return true;
      }
    ) || [];
  const favoriteDevicesQuery: Array<string> =
    isFilteredToFavorites &&
    filterResolverInput?.favoriteDevices &&
    filterResolverInput?.favoriteDevices.length > 0
      ? [`thingName = (${filterResolverInput.favoriteDevices.join(' OR ')})`]
      : [];
  const filtersQuery: string =
    filtersWithoutFavorites
      .map(constructQueryString)
      .join(`) ${filterResolverInput?.operation.toUpperCase() || 'AND'} (`) ||
    '';
  const query: string = filtersQuery
    ? [...favoriteDevicesQuery, filtersQuery].join(
        `) ${filterResolverInput?.operation.toUpperCase() || 'AND'} (`
      )
    : [...favoriteDevicesQuery].join('');

  console.log('queryString', query ? `(${query})` : '*');
  return query ? `(${query})` : '*';
}

export function timeAmountFormatter(v: number): string {
  return Math.abs(v) >= 60 * 60 * 24
    ? (v / (60 * 60 * 24)).toFixed(1) +
        ` day${v / (60 * 60 * 24) === 1 ? '' : 's'}`
    : Math.abs(v) >= 60 * 60
      ? (v / (60 * 60)).toFixed(1) + ` hour${v / (60 * 60) === 1 ? '' : 's'}`
      : Math.abs(v) >= 60
        ? (v / 60).toFixed(1) + ` minute${v / 60 === 1 ? '' : 's'}`
        : v.toFixed(0) + ` second${v === 1 ? '' : 's'}`;
}

export function countFormatter(v: number, decimalPlaces: number = 0): string {
  return Math.abs(v) >= 1e9
    ? (v / 1e9).toFixed(decimalPlaces).replace(/\.0+$/, '') + 'G'
    : Math.abs(v) >= 1e6
      ? (v / 1e6).toFixed(decimalPlaces).replace(/\.0+$/, '') + 'M'
      : Math.abs(v) >= 1e3
        ? (v / 1e3).toFixed(decimalPlaces).replace(/\.0+$/, '') + 'K'
        : v.toFixed(decimalPlaces);
}

export function timestampFormatter(d: Date): string {
  return d
    .toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true
    })
    .split(',')
    .join('\n');
}

export const SAMPLE_EVENT: Omit<AppSyncResolverEvent<never>, 'arguments'> = {
  info: {
    fieldName: '',
    parentTypeName: '',
    selectionSetGraphQL: '',
    selectionSetList: [],
    variables: {}
  },
  prev: null,
  request: {
    domainName: null,
    headers: {}
  },
  source: null,
  stash: {}
};

export const SAMPLE_CONTEXT: Context = {
  callbackWaitsForEmptyEventLoop: true,
  functionVersion: '$LATEST',
  functionName: 'foo-bar-function',
  memoryLimitInMB: '128',
  logGroupName: '/aws/lambda/foo-bar-function-123456abcdef',
  logStreamName: '2021/03/09/[$LATEST]abcdef123456abcdef123456abcdef123456',
  invokedFunctionArn:
    'arn:aws:lambda:eu-west-1:123456789012:function:foo-bar-function',
  awsRequestId: 'c6af9ac6-7b61-11e6-9a41-93e812345678',
  getRemainingTimeInMillis: (): number => 1234,
  done: (): void => console.log('Done!'),
  fail: (): void => console.log('Failed!'),
  succeed: (): void => console.log('Succeeded!')
};
