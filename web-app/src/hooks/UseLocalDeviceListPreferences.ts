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

import { useState } from 'react';
import type { GenericReactState } from '@bfw/shared/src/types';
import type { CollectionPreferencesProps } from '@cloudscape-design/components/collection-preferences';
import type { NonCancelableCustomEvent } from '@cloudscape-design/components/interfaces';

export const DEFAULT_PAGE_SIZE: number = 20;

export interface PreferencesConfig {
  storageKey: string;
  defaultPreferences: CollectionPreferencesProps.Preferences;
}

export type NonCancelableEventHandler<Detail = Record<string, unknown>> = (
  event: NonCancelableCustomEvent<Detail>
) => void;

export interface UseDeviceListPreferencesHook {
  localPreferences: CollectionPreferencesProps.Preferences;
  confirmLocalPreferences: NonCancelableEventHandler<CollectionPreferencesProps.Preferences>;
  setLocalPreferences: (
    localPreferences: CollectionPreferencesProps.Preferences
  ) => void;
}

export function useLocalDeviceListPreferences(
  config: PreferencesConfig
): UseDeviceListPreferencesHook {
  const [
    localPreferences,
    setLocalPreferences
  ]: GenericReactState<CollectionPreferencesProps.Preferences> =
    useState<CollectionPreferencesProps.Preferences>(
      (): CollectionPreferencesProps.Preferences => {
        const savedPreferences: string | null = localStorage.getItem(
          config.storageKey
        );

        if (savedPreferences) {
          try {
            return {
              ...config.defaultPreferences,
              ...(JSON.parse(
                savedPreferences
              ) as CollectionPreferencesProps.Preferences)
            };
          } catch (error: unknown) {
            console.error('Error parsing saved preferences:', error);
            return config.defaultPreferences;
          }
        }

        return config.defaultPreferences;
      }
    );

  function confirmLocalPreferences(
    event: NonCancelableCustomEvent<CollectionPreferencesProps.Preferences>
  ): void {
    const newLocalPreferences: CollectionPreferencesProps.Preferences =
      event.detail;
    const updatedLocalPreferences: CollectionPreferencesProps.Preferences = {
      pageSize: newLocalPreferences.pageSize ?? localPreferences.pageSize,
      visibleContent: [...(newLocalPreferences.visibleContent ?? [])],
      wrapLines: newLocalPreferences.wrapLines ?? localPreferences.wrapLines,
      stripedRows:
        newLocalPreferences.stripedRows ?? localPreferences.stripedRows,
      contentDensity:
        newLocalPreferences.contentDensity ?? localPreferences.contentDensity,
      stickyColumns: {
        first: newLocalPreferences.stickyColumns?.first ?? 0,
        last: newLocalPreferences.stickyColumns?.last ?? 0
      },
      contentDisplay: newLocalPreferences.contentDisplay
        ? [...newLocalPreferences.contentDisplay]
        : localPreferences.contentDisplay
    };
    setLocalPreferences(updatedLocalPreferences);
  }

  return {
    localPreferences,
    confirmLocalPreferences,
    setLocalPreferences
  };
}

export const defaultPreferencesConfig: PreferencesConfig = {
  storageKey: 'deviceListPreferences',
  defaultPreferences: {
    pageSize: DEFAULT_PAGE_SIZE,
    visibleContent: [
      'favorite',
      'thingName',
      'connected',
      'lastConnectedAt',
      'disconnectReason',
      'deviceType'
    ],
    wrapLines: true,
    stripedRows: true,
    contentDensity: 'comfortable',
    stickyColumns: { first: 0, last: 0 },
    contentDisplay: [
      { id: 'favorite', visible: true },
      { id: 'thingName', visible: true },
      { id: 'connected', visible: true },
      { id: 'lastConnectedAt', visible: true },
      { id: 'disconnectReason', visible: true },
      { id: 'deviceType', visible: true },
      { id: 'provisioningTimestamp', visible: false },
      { id: 'productionTimestamp', visible: false },
      { id: 'brandName', visible: false },
      { id: 'country', visible: false },
      { id: 'hasApplianceFW', visible: false },
      { id: 'firmwareType', visible: false },
      { id: 'firmwareVersion', visible: false },
      { id: 'thingGroupNames', visible: false }
    ]
  }
};
