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
 *
 */

import type {
  PropertyFilterOperator,
  PropertyFilterQuery,
  PropertyFilterToken
} from '@cloudscape-design/collection-hooks';
import {
  type Filter,
  type FilterInput,
  FilterOperation,
  FilterOperator,
  type FilterPreference,
  type FilterPreferenceInput,
  type FilterResolverInput
} from '@bfw/shared/src/appsync';

const getPropertyFilterQueryFromOperator: (filterOperator: string) => string = (
  filterOperator: string
): string => {
  switch (filterOperator) {
    case FilterOperator.None as string:
      return ':';
    case FilterOperator.Lt as string:
      return '<';
    case FilterOperator.Le as string:
      return '<=';
    case FilterOperator.Gt as string:
      return '>';
    case FilterOperator.Ge as string:
      return '>=';
    case FilterOperator.Eq as string:
      return '=';
    case FilterOperator.Ne as string:
      return '!=';
    default:
      return '=';
  }
};

export const getTypedValueForField: (
  fieldName: string,
  value: string
) => boolean | number | string = (
  fieldName: string,
  value: string
): boolean | number | string => {
  if (fieldName.toLowerCase().includes('timestamp')) {
    return new Date(value).getTime();
  } else if (
    fieldName === 'connectivity.connected' ||
    fieldName === 'attributes.hasApplianceFW'
  ) {
    return value === 'true';
  } else {
    return value;
  }
};

export const getTypedValueForFilterField: (
  fieldName: string,
  value: string
) => boolean | number | string = (
  fieldName: string,
  value: string
): boolean | number | string => {
  if (fieldName.toLowerCase().includes('timestamp')) {
    return new Date(Number(value)).toISOString().slice(0, 10);
  } else {
    return value;
  }
};

export const convertToFilterOperator: (
  propertyFilterOperator: PropertyFilterOperator
) => FilterOperator = (
  propertyFilterOperator: PropertyFilterOperator
): FilterOperator => {
  switch (propertyFilterOperator) {
    case ':':
      return FilterOperator.None;
    case '<':
      return FilterOperator.Lt;
    case '<=':
      return FilterOperator.Le;
    case '>':
      return FilterOperator.Gt;
    case '>=':
      return FilterOperator.Ge;
    case '=':
      return FilterOperator.Eq;
    case '!=':
      return FilterOperator.Ne;
    default:
      return FilterOperator.Eq;
  }
};

export const convertPropertyFilterQueryToFilterResolverInput: (
  detail: PropertyFilterQuery,
  favoriteDevices: Set<string>
) => FilterResolverInput = (
  detail: PropertyFilterQuery,
  favoriteDevices: Set<string>
): FilterResolverInput => {
  const filters: Array<FilterInput> = [];
  detail.tokens.forEach((token: PropertyFilterToken): void => {
    const fieldName: string = (token.propertyKey as string) || '';
    filters.push({
      fieldName: fieldName,
      operator: convertToFilterOperator(token.operator),
      value: getTypedValueForField(fieldName, token.value as string).toString()
    });
  });
  return {
    operation: detail.operation,
    filters: filters,
    favoriteDevices: Array.from(favoriteDevices)
  };
};

export const convertFilterPreferenceToPropertyFilterQuery: (
  filterPreference: FilterPreference
) => PropertyFilterQuery = (
  filterPreference: FilterPreference
): PropertyFilterQuery => {
  const tokens: Array<PropertyFilterToken> = [];
  filterPreference.filters?.forEach((filter: Filter): void => {
    tokens.push({
      propertyKey: filter.fieldName,
      operator: getPropertyFilterQueryFromOperator(filter.operator),
      value: getTypedValueForFilterField(filter.fieldName, filter.value)
    });
  });
  return {
    tokens,
    operation: filterPreference.operation
  };
};

export const convertFilterPreferenceInputToOutput: (
  filterPreferenceInput: FilterPreferenceInput
) => FilterPreference = (
  filterPreferenceInput: FilterPreferenceInput
): FilterPreference => {
  return {
    name: filterPreferenceInput.name,
    operation: filterPreferenceInput.operation,
    filters: filterPreferenceInput.filters
      ? filterPreferenceInput.filters.map((filter: FilterInput): Filter => {
          return {
            fieldName: filter.fieldName,
            operator: filter.operator,
            value: filter.value
          };
        })
      : null
  };
};

export function convertURLSearchParamsToFilterResolverInput(
  params: URLSearchParams,
  favoriteDevices: Array<string> | null = null
): FilterResolverInput {
  if (!params.has('query')) {
    return {
      filters: null,
      operation: FilterOperation.And,
      favoriteDevices: favoriteDevices
    };
  }
  const query: PropertyFilterQuery = JSON.parse(params.get('query')!);
  const filters: Array<Filter> = query.tokens
    .filter(
      (token: PropertyFilterToken): boolean => token.propertyKey !== 'favorite'
    )
    .map(
      (token: PropertyFilterToken): Filter => ({
        fieldName: token.propertyKey!,
        operator: convertToFilterOperator(token.operator),
        value: getTypedValueForField(
          token?.propertyKey || '',
          token.value as string
        ).toString()
      })
    );
  return {
    filters: filters,
    operation: query.operation || FilterOperation.And,
    favoriteDevices
  };
}

export function convertPropertyFilterQueryToURLSearchParams(
  detail: PropertyFilterQuery
): URLSearchParams {
  const params: URLSearchParams = new URLSearchParams();
  if (detail.tokens.length) {
    params.set('query', JSON.stringify(detail));
  }
  return params;
}
