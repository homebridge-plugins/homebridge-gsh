import { ServiceType } from '@homebridge/hap-client';
import type { SmartHomeV1ExecuteRequestCommands, SmartHomeV1ExecuteResponseCommands } from 'actions-on-google';
import { PlatformConfig } from 'homebridge';

export interface PluginConfig extends PlatformConfig {
  platform: string;
  name: string;
  token: string;
  debug?: boolean;
  twoFactorAuthPin: string;
  disablePinCodeRequirement?: boolean;
  instanceBlacklist?: Array<string>;
  accessoryFilter?: Array<string>;
  accessoryFilterInverse?: boolean;
  accessorySerialFilter?: Array<string>;
  forceFahrenheit?: boolean;
  betaServer?: boolean;
  showHeaterCoolerAsACUnit?: boolean;
  discoveryTimeout?: number;
  discoveryWait?: number;
}

export interface Instance {
  ipAddress: string;
  port: number;
  username: string;
  evCharacteristics?: {
    aid: number;
    iid: number;
    ev: boolean;
    ipAddress?: string;
    port?: number;
    username?: string;
    registered?: boolean;
  }[];
}

export interface HapCharacteristic {
  iid: number;
  type: string;
  perms: Array<'pr' | 'pw' | 'ev' | 'aa' | 'tw' | 'hd' | 'wr'>;
  format: 'bool' | 'int' | 'float' | 'string' | 'uint8' | 'uin16' | 'uin32' | 'uint64' | 'data' | 'tlv8' | 'array' | 'dict';
  value: any;
  description?: string;
  unit?: 'celsius' | 'percentage' | 'arcdegrees' | 'lux' | 'seconds';
  maxValue?: number;
  minValue?: number;
  minStep?: number;
  maxLen?: number;
  maxDataLen?: number;
  validValues?: number[];
  validValueRanges?: [number, number];
}

export interface HapService {
  iid: number;
  type: string;
  characteristics?: HapCharacteristic[];
  primary?: boolean;
  hidden?: boolean;
  serialNumber?: string;

  // custom
  uniqueId?: string;
  serviceName?: string;
  accessoryInformation?: any;
  aid?: number;
  serviceType?: string;
  instance?: Instance;
}

export interface HapAccessory {
  aid: number;
  services: HapService[];
}

export interface HapInstance {
  ipAddress: string;
  instance: {
    addresses: string[];
    name: string;
    fqdn: string;
    host: string;
    referer: {
      address: string;
      family: string;
      port: number;
      size: number;
    };
    port: number;
    type: string;
    protocol: string;
    subtypes: any[];
    txt: {
      md: string;
      pv: string;
      id: string;
    };
  };
  accessories: {
    accessories: HapAccessory[];
  };
}

export interface AccessoryTypeExecuteResponse {
  payload?: any;
  states?: undefined | Record<string, any>;
}

export interface HapDevice {
  sync: (service: ServiceType) => Record<string, any>;
  query: (service: ServiceType) => Record<string, any>;
  execute: (service: ServiceType, command: SmartHomeV1ExecuteRequestCommands) => Promise<SmartHomeV1ExecuteResponseCommands>;
}
