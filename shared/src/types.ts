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

import type { SchedulingMode, SchedulingType } from './enums';

// Firmware types based on device simulator configuration
export enum FirmwareType {
  Bootloader = 'bootloader',
  Application = 'application',
  Modem = 'modem',
  Radio = 'radio'
}
import type { Dispatch, SetStateAction } from 'react';
import type { RetainedTopic } from './appsync';

export type GenericReactState<T> = [T, Dispatch<SetStateAction<T>>];
export type ReactEffectDestructor = () => void;

export interface ThingShadow<T = ThingShadowPayload> {
  state: {
    desired?: Partial<T>;
    reported: T;
    delta?: Partial<T>;
  };
  metadata: {
    desired?: Partial<
      Record<
        keyof T,
        {
          timestamp: number;
        }
      >
    >;
    reported: Record<
      keyof T,
      {
        timestamp: number;
      }
    >;
    delta?: Partial<
      Record<
        keyof T,
        {
          timestamp: number;
        }
      >
    >;
  };
  version: number;
  timestamp: number;
}

export type ThingShadowPayload =
  | DeviceShadowPayload
  | ScheduleShadowPayload
  | PackageShadowPayload;

export type StateShadow = ThingShadow<DeviceShadowPayload>;

export interface DeviceShadowPayload {
  powerEnabled?: boolean;
  opMode?: string;
  onTimestamp?: number;
  offTimestamp?: number;
  dataLakeBasePublishInterval?: number;

  // Generic interface to support any device properties
  [key: string]: unknown;
}

export type ScheduleShadow = ThingShadow<ScheduleShadowPayload>;

export interface ScheduleShadowPayload {
  env: string;
  type: SchedulingType;
  tz: string;
  on: boolean;
  idx: number;
  schedules: string;

  [key: string]: unknown;
}

export interface Schedule {
  name?: string;
  mode: SchedulingMode;
  days: {
    mon?: Array<SwitchPoint>;
    tue?: Array<SwitchPoint>;
    wed?: Array<SwitchPoint>;
    thu?: Array<SwitchPoint>;
    fri?: Array<SwitchPoint>;
    sat?: Array<SwitchPoint>;
    sun?: Array<SwitchPoint>;
    all?: Array<SwitchPoint>;
  };
}

export interface ScheduleStates {
  powerEnabled: boolean;

  [key: string]: unknown;
}

export type SwitchPoint = {
  time: number;
} & ScheduleStates;

export interface ScheduleExecInput {
  serialNumber: string;
  timeZone: string;
  states: Record<string, unknown>;
}

export type PackageShadow = ThingShadow<PackageShadowPayload>;

export type PackageShadowPayload =
  | {
      [FirmwareType.Bootloader]: SoftwarePackageVersion;
    }
  | {
      [FirmwareType.Application]: SoftwarePackageVersion;
    }
  | {
      [FirmwareType.Modem]: SoftwarePackageVersion;
    }
  | {
      [FirmwareType.Radio]: SoftwarePackageVersion;
    };

export interface SoftwarePackageVersion {
  version: string;
  attributes: {
    versionInt: number;
    autoUpdate?: boolean;
    jobId?: string;
    consent?: string;
  };
}

export type RetainedTopicPayload =
  | InfoTopicPayload
  | MetaTopicPayload
  | SensorTopicPayload;

export interface InfoTopicPayload {
  timestamp: number;
  online: boolean;
  gateway: {
    serialNumber: string;
    hardwareVersion: string;
    firmwareVersion: string;
    commitHash: string;
  };
  network: {
    mac: string;
    ssid: string;
    signalQuality: 'excellent' | 'good' | 'medium' | 'poor';
  };
  appliance: {
    type: string;
    serialNumber: string;
    firmwareVersion: string;
  };
  matterOnboarding?: {
    qrCodeData?: string;
    manualPairingCode?: string;
    commissioningWindowOpen: boolean;
    commissioned: boolean;
    fabrics: Array<{
      label: string;
      vendorId: number;
    }>;
  };
  errorInfo?: {
    causeCode: string;
    displayCode: string;
    errorClass: string;
  };
}

export interface MetaTopicPayload {
  [key: string]: unknown;
}

export interface SensorTopicPayload {
  [key: string]: unknown;
}

export interface LocationRecord {
  serialNumber: string;
  deviceType: string;
  city: string;
  state: string;
  country: string;
  timezone?: string;
  created: string;

  [key: string]: unknown;
}

export interface AppSyncResolverError {
  message: string;
  type: string;
}

export interface AppSyncResolverResponse<T> {
  data?: T;
  errors?: Array<AppSyncResolverError>;
}

export type RawRetainedTopic = Omit<RetainedTopic, 'payload'> & {
  payload: object;
};

export interface SharedConfig {
  userPoolId: string;
  userPoolClientId: string;
  appSyncURL: string;
  region: string;
  account: string;
}
