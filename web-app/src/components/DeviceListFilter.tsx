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
 *
 */

import { useState, type FunctionComponent, type ReactElement } from 'react';
import type {
  PropertyFilterOperatorExtended,
  PropertyFilterOperatorFormProps,
  PropertyFilterQuery
} from '@cloudscape-design/collection-hooks';
import FormField from '@cloudscape-design/components/form-field';
import type { NonCancelableCustomEvent } from '@cloudscape-design/components/interfaces';
import DatePicker from '@cloudscape-design/components/date-picker';
import Calendar, {
  type CalendarProps
} from '@cloudscape-design/components/calendar';
import PropertyFilter, {
  type PropertyFilterProps
} from '@cloudscape-design/components/property-filter';
import DateInput from '@cloudscape-design/components/date-input';
import Input, { type InputProps } from '@cloudscape-design/components/input';
import Select, { type SelectProps } from '@cloudscape-design/components/select';
import type { GenericReactState } from '@bfw/shared/src/types';
import { parse, type SemVer, valid } from 'semver';
import Button from '@cloudscape-design/components/button';
import SpaceBetween from '@cloudscape-design/components/space-between';

export interface DeviceListFilterProps {
  query: PropertyFilterQuery;
  firmwareTypes: Array<string>;
  handleQueryUpdate: (detail: PropertyFilterQuery) => void;
  customFilterActions?: ReactElement;
  customControl?: ReactElement;
}

interface FirmwareFilter {
  firmwareType?: string;
  firmwareVersion?: string;
}

export function dateFilteringMapFunction(
  operator: string
): PropertyFilterOperatorExtended<string> {
  return {
    operator,
    form: ({
      value,
      onChange,
      filter
    }: PropertyFilterOperatorFormProps<string>): ReactElement => {
      if (typeof filter === 'undefined') {
        return (
          <FormField>
            <DatePicker
              value={value ?? ''}
              onChange={(
                event: NonCancelableCustomEvent<CalendarProps.ChangeDetail>
              ): void => onChange(event.detail.value)}
              placeholder="YYYY/MM/DD"
              locale="en-GB"
            />
          </FormField>
        );
      }
      return (
        <div className="date-form">
          <FormField>
            <DateInput
              value={value ?? ''}
              onChange={(
                event: NonCancelableCustomEvent<InputProps.ChangeDetail>
              ): void => onChange(event.detail.value)}
              placeholder="YYYY/MM/DD"
            />
          </FormField>
          <Calendar
            value={value ?? ''}
            onChange={(
              event: NonCancelableCustomEvent<CalendarProps.ChangeDetail>
            ): void => onChange(event.detail.value)}
            locale="en-GB"
          />
        </div>
      );
    },
    match: 'date'
  };
}

function firmwareFilteringMapFunction(
  firmwareTypes: Record<string, SelectProps.Option>
): (operator: string) => PropertyFilterOperatorExtended<FirmwareFilter> {
  return (
    operator: string
  ): PropertyFilterOperatorExtended<FirmwareFilter> => ({
    operator,
    format: (value: FirmwareFilter | null): string =>
      `${value?.firmwareType || '*'}/${value?.firmwareVersion || '*'}`,
    form: ({
      value,
      onChange
    }: PropertyFilterOperatorFormProps<FirmwareFilter>): ReactElement => {
      const [invalid, setInvalid]: GenericReactState<boolean> = useState(
        !value?.firmwareVersion ||
          (operator === '=' && value?.firmwareVersion === '*')
          ? false
          : !valid(value?.firmwareVersion)
      );
      return (
        <>
          <FormField label="Firmware Type">
            <Select
              onChange={({
                detail
              }: NonCancelableCustomEvent<SelectProps.ChangeDetail>): void =>
                onChange({
                  firmwareType: detail.selectedOption.value,
                  firmwareVersion: value?.firmwareVersion
                })
              }
              selectedOption={
                firmwareTypes[
                  value?.firmwareType || Object.keys(firmwareTypes)[0]
                ]
              }
              options={Object.values(firmwareTypes)}
              placeholder="Enter Firmware Type"
              expandToViewport
            />
          </FormField>
          <FormField label="Firmware Version">
            <Input
              onChange={({
                detail
              }: NonCancelableCustomEvent<InputProps.ChangeDetail>): void => {
                setInvalid(
                  !detail.value || (operator === '=' && detail.value === '*')
                    ? false
                    : !valid(detail.value)
                );
                onChange({
                  firmwareType:
                    value?.firmwareType || Object.keys(firmwareTypes)[0],
                  firmwareVersion: detail.value
                });
              }}
              onKeyDown={(event: CustomEvent<InputProps.KeyDetail>): void => {
                const allowed: Array<string> = [
                  'Backspace',
                  'Tab',
                  'Enter',
                  'ArrowUp',
                  'ArrowDown',
                  'ArrowLeft',
                  'ArrowRight',
                  'Home',
                  'End',
                  'PageUp',
                  'PageDown',
                  'Delete',
                  '.',
                  '0',
                  '1',
                  '2',
                  '3',
                  '4',
                  '5',
                  '6',
                  '7',
                  '8',
                  '9'
                ];
                if (
                  !event.detail.ctrlKey &&
                  !event.detail.metaKey &&
                  !allowed.includes(event.detail.key) &&
                  (operator !== '=' || event.detail.key !== '*')
                ) {
                  event.preventDefault();
                }
              }}
              value={value?.firmwareVersion?.toString() ?? ''}
              placeholder="Enter a Version"
              invalid={invalid}
            />
          </FormField>
        </>
      );
    }
  });
}

function getFilteringProperties(
  firmwareTypes: Record<string, SelectProps.Option>
): Array<PropertyFilterProps.FilteringProperty> {
  return [
    {
      key: 'favorite',
      groupValuesLabel: 'Filter to Favorites',
      propertyLabel: 'Filter to Favorites',
      operators: ['=']
    },
    {
      key: 'thingName',
      groupValuesLabel: 'Serial Number',
      propertyLabel: 'Serial Number',
      operators: ['=', '!=']
    },
    {
      key: 'thingTypeName',
      groupValuesLabel: 'Device Type',
      propertyLabel: 'Device Type',
      operators: ['=', '!=']
    },
    {
      key: 'connectivity.disconnectReason',
      groupValuesLabel: 'Disconnect Reason',
      propertyLabel: 'Disconnect Reason',
      operators: ['=', '!=']
    },
    {
      key: 'connectivity.connected',
      groupValuesLabel: 'Connection Status',
      propertyLabel: 'Connection Status',
      operators: ['=']
    },
    {
      key: 'attributes.hasApplianceFW',
      groupValuesLabel: 'Has Appliance Firmware',
      propertyLabel: 'Has Appliance Firmware',
      operators: ['=']
    },
    {
      key: 'connectivity.timestamp',
      propertyLabel: 'Last Connected Timestamp',
      groupValuesLabel: 'Last Connected Timestamp',
      operators: ['<', '<=', '>', '>='].map(dateFilteringMapFunction),
      defaultOperator: '>='
    },
    {
      key: 'attributes.provisioningTimestamp',
      groupValuesLabel: 'Provisioning Timestamp',
      propertyLabel: 'Provisioning Timestamp',
      operators: ['<', '<=', '>', '>='].map(dateFilteringMapFunction),
      defaultOperator: '>='
    },
    {
      key: 'attributes.productionTimestamp',
      groupValuesLabel: 'Production Timestamp',
      propertyLabel: 'Production Timestamp',
      operators: ['<', '<=', '>', '>='].map(dateFilteringMapFunction),
      defaultOperator: '>='
    },
    {
      key: 'attributes.brandName',
      groupValuesLabel: 'Brand Name',
      propertyLabel: 'Brand Name',
      operators: ['=', '!=']
    },
    {
      key: 'attributes.country',
      groupValuesLabel: 'Country',
      propertyLabel: 'Country',
      operators: ['=', '!=']
    },
    {
      key: 'firmware',
      groupValuesLabel: 'Firmware',
      propertyLabel: 'Firmware',
      operators: ['=', '<', '<=', '>', '>='].map(
        firmwareFilteringMapFunction(firmwareTypes)
      ),
      defaultOperator: '>='
    },
    {
      key: 'attributes.modelName',
      groupValuesLabel: 'Model Name',
      propertyLabel: 'Model Name',
      operators: ['=', '!=']
    },
    {
      key: 'thingGroupNames',
      groupValuesLabel: 'Thing Group Name',
      propertyLabel: 'Thing Group Name',
      operators: ['=', '!=']
    }
  ];
}

const filteringOptions: Array<PropertyFilterProps.FilteringOption> = [
  {
    propertyKey: 'connectivity.connected',
    value: 'true'
  },
  {
    propertyKey: 'connectivity.connected',
    value: 'false'
  },
  {
    propertyKey: 'attributes.hasApplianceFW',
    value: 'true'
  },
  {
    propertyKey: 'attributes.hasApplianceFW',
    value: 'false'
  },
  {
    propertyKey: 'favorite',
    value: 'true'
  }
];

export const DeviceListFilter: FunctionComponent<DeviceListFilterProps> = ({
  query,
  firmwareTypes,
  handleQueryUpdate,
  customFilterActions,
  customControl
}: DeviceListFilterProps): ReactElement => {
  const firmwareTypeOptions: Record<string, SelectProps.Option> =
    firmwareTypes.reduce(
      (
        types: Record<string, SelectProps.Option>,
        type: string
      ): Record<string, SelectProps.Option> => {
        types[type] = { value: type };
        return types;
      },
      {}
    );
  for (const [index, token] of query?.tokens?.entries() || []) {
    if (token.propertyKey?.startsWith('shadow.name.$package.reported.')) {
      const firmwareType: string = token.propertyKey.split('.')[4];
      if (token.propertyKey?.endsWith('.attributes.versionInt')) {
        query.tokens[index].value = {
          firmwareType,
          firmwareVersion: parse(
            (token.value as string).split(/(?=(?:..)*$)/).join('.'),
            true
          )?.toString()
        };
      } else if (token.propertyKey?.endsWith('.version')) {
        query.tokens[index].value = {
          firmwareType,
          firmwareVersion: token.value
        };
      }
      query.tokens[index].propertyKey = 'firmware';
    }
  }
  return (
    <PropertyFilter
      query={query}
      freeTextFiltering={{
        defaultOperator: ':',
        operators: [':']
      }}
      onChange={({
        detail
      }: NonCancelableCustomEvent<PropertyFilterQuery>): void => {
        for (const [index, token] of detail.tokens.entries()) {
          if (token.propertyKey === 'firmware') {
            const firmwareType: string =
              (token.value as FirmwareFilter).firmwareType || '*';
            if (token.operator === '=') {
              detail.tokens[index].propertyKey =
                `shadow.name.$package.reported.${firmwareType}.version`;
              detail.tokens[index].value = (
                token.value as FirmwareFilter
              ).firmwareVersion;
            } else {
              const firmwareVersion: SemVer | null = parse(
                (token.value as FirmwareFilter).firmwareVersion,
                true
              );
              detail.tokens[index].propertyKey =
                `shadow.name.$package.reported.${firmwareType}.attributes.versionInt`;
              detail.tokens[index].value =
                `${firmwareVersion?.major?.toString()?.padStart(1, '0')}${firmwareVersion?.minor?.toString()?.padStart(2, '0')}${firmwareVersion?.patch?.toString()?.padStart(2, '0')}`;
            }
          }
        }
        handleQueryUpdate(detail);
      }}
      filteringProperties={getFilteringProperties(firmwareTypeOptions)}
      filteringOptions={filteringOptions}
      filteringPlaceholder="Filter devices"
      customControl={customControl}
      customFilterActions={
        <SpaceBetween alignItems="center" size="m" direction="horizontal">
          <Button
            onClick={(): void =>
              handleQueryUpdate({
                tokens: [],
                operation: 'and'
              })
            }
          >
            Clear filters
          </Button>
          {customFilterActions}
        </SpaceBetween>
      }
    />
  );
};
