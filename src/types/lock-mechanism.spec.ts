import { CharacteristicType, ServiceType } from '@homebridge/hap-client';
import { describe, expect, it } from 'vitest';
import { Characteristic } from '../hap-types';
import { LockMechanism } from './lock-mechanism';
const lockMechanism = new LockMechanism();

describe('lockMechanism', () => {
  describe('sync message', () => {
    it('lockMechanism with On/Off only', async () => {
      const response: any = lockMechanism.sync(lockMechanismServiceOnOff);
      expect(response).toBeDefined();
      expect(response.type).toBe('action.devices.types.LOCK');
      expect(response.traits).toContain('action.devices.traits.LockUnlock');
      expect(response.traits).not.toContain('action.devices.traits.Brightness');
      expect(response.traits).not.toContain('action.devices.traits.ColorSetting');
      expect(response.attributes).not.toBeDefined();
      expect(response.name).toBeDefined();
      // await sleep(10000)
    });
  });
  describe('query message', () => {
    it('lockMechanism with On/Off only', async () => {
      const response = lockMechanism.query(lockMechanismServiceOnOff);
      expect(response).toBeDefined();
      expect(response.online).toBeDefined();
      expect(response.isLocked).toBeDefined();
      expect(response.isJammed).toBeDefined();

      // await sleep(10000)
    });
  });

  describe('execute message', () => {
    it('lock', async () => {
      const response = await lockMechanism.execute(lockMechanismServiceOnOff, commandLock);
      expect(response).toBeDefined();
      expect(response.ids).toBeDefined();
      expect(response.status).toBe('SUCCESS');
      // await sleep(10000)
    });

    it('unlock', async () => {
      const response = await lockMechanism.execute(lockMechanismServiceOnOff, commandUnlock);
      expect(response).toBeDefined();
      expect(response.ids).toBeDefined();
      expect(response.status).toBe('SUCCESS');
      // await sleep(10000)
    });

    it('lockMechanism with On/Off only - commandMalformed', async () => {
      const response = await lockMechanism.execute(lockMechanismServiceOnOff, commandMalformed);
      expect(response).toBeDefined();
      expect(response.ids).toBeDefined();
      expect(response.status).toBe('ERROR');
    });

    it('lockMechanism with On/Off only - commandIncorrectCommand', async () => {
      const response = await lockMechanism.execute(lockMechanismServiceOnOff, commandIncorrectCommand);
      expect(response).toBeDefined();
      expect(response.ids).toBeDefined();
      expect(response.status).toBe('ERROR');
    });

    it('lockMechanism with On/Off only - Error', async () => {
      expect.assertions(1);
      lockMechanismServiceOnOff.serviceCharacteristics[0].setValue = setValueError;
      await expect(lockMechanism.execute(lockMechanismServiceOnOff, commandLock)).rejects.toThrow('Error setting value');
      // await sleep(10000)
    });
  });

  describe('2 factor authentication', () => {
    it('twoFactorRequired should be set', async () => {
      expect(lockMechanism.twoFactorRequired).toBeDefined();
      expect(lockMechanism.twoFactorRequired).toBe(true);
    });

    it('Lock - must not request PIN', async () => {
      const response = await lockMechanism.is2faRequired(commandLock);
      expect(response).toBeDefined();
      expect(response).toBe(false);
      // expect(response.ids).toBeDefined();
      // expect(response.status).toBe('SUCCESS');
    });

    it('Unlock - must request PIN', async () => {
      const response = await lockMechanism.is2faRequired(commandUnlock);
      expect(response).toBeDefined();
      expect(response).toBe(true);
      // expect(response.ids).toBeDefined();
      // expect(response.status).toBe('SUCCESS');
    });
  });
});

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

const setValue = async function (value: string | number | boolean): Promise<CharacteristicType> {
  // Perform your operations here
  const result: CharacteristicType = {
    aid: 1,
    iid: 1,
    uuid: '00000025-0000-1000-8000-0026BB765291',
    type: 'On',
    serviceType: 'LockMechanism',
    serviceName: 'Trailer Step',
    description: 'On',
    value: 0,
    format: 'bool',
    perms: [
      'ev',
      'pr',
      'pw',
    ],
    canRead: true,
    canWrite: true,
    ev: true,
  };
  return result;
};

const setValueError = async function (value: string | number | boolean): Promise<CharacteristicType> {
  // Perform your operations here
  throw new Error('Error setting value');
};

const getValue = async function (): Promise<CharacteristicType> {
  // Perform your operations here
  const result: CharacteristicType = {
    aid: 1,
    iid: 1,
    uuid: '00000025-0000-1000-8000-0026BB765291',
    type: 'On',
    serviceType: 'LockMechanism',
    serviceName: 'Trailer Step',
    description: 'On',
    value: 0,
    format: 'bool',
    perms: [
      'ev',
      'pr',
      'pw',
    ],
    canRead: true,
    canWrite: true,
    ev: true,
  };
  return result;
};

const refreshCharacteristics = async function (): Promise<ServiceType> {
  return lockMechanismServiceOnOff;
};

const setCharacteristic = async function (value: string | number | boolean): Promise<ServiceType> {
  // Perform your operations here
  const result: CharacteristicType = {
    aid: 1,
    iid: 1,
    uuid: '00000025-0000-1000-8000-0026BB765291',
    type: 'On',
    serviceType: 'LockMechanism',
    serviceName: 'Trailer Step',
    description: 'On',
    value: 0,
    format: 'bool',
    perms: [
      'ev',
      'pr',
      'pw',
    ],
    canRead: true,
    canWrite: true,
    ev: true,
  };
  return lockMechanismServiceOnOff;
};

const getCharacteristic = function (): CharacteristicType {
  // Perform your operations here
  const result: CharacteristicType = {
    aid: 1,
    iid: 1,
    uuid: '00000025-0000-1000-8000-0026BB765291',
    type: 'On',
    serviceType: 'LockMechanism',
    serviceName: 'Trailer Step',
    description: 'On',
    value: 0,
    format: 'bool',
    perms: [
      'ev',
      'pr',
      'pw',
    ],
    canRead: true,
    canWrite: true,
    ev: true,
  };
  return result;
};

const lockMechanismServiceOnOff: ServiceType = {
  aid: 13,
  iid: 8,
  uuid: '00000043-0000-1000-8000-0026BB765291',
  type: 'LockMechanism',
  humanType: 'LockMechanism',
  serviceName: 'Shed Light',
  serviceCharacteristics: [
    {
      aid: 13,
      iid: 11,
      uuid: Characteristic.LockTargetState,
      type: 'LockTargetState',
      serviceType: 'LockMechanism',
      serviceName: 'Shed Light',
      description: 'Configured Name',
      value: 1,
      format: 'string',
      perms: ['ev', 'pr', 'pw'],
      unit: undefined,
      maxValue: undefined,
      minValue: undefined,
      minStep: undefined,
      canRead: true,
      canWrite: true,
      ev: true,
      setValue,
      getValue,
    },
    {
      aid: 13,
      iid: 10,
      uuid: '000000B0-0000-1000-8000-0026BB765291',
      type: 'Active',
      serviceType: 'LockMechanism',
      serviceName: 'Shed Light',
      description: 'On',
      value: 0,
      format: 'bool',
      perms: ['ev', 'pr', 'pw'],
      unit: undefined,
      maxValue: undefined,
      minValue: undefined,
      minStep: undefined,
      canRead: true,
      canWrite: true,
      ev: true,
      setValue,
      getValue,
    },
    {
      aid: 13,
      iid: 10,
      uuid: '0000007C-0000-1000-8000-0026BB765291',
      type: 'TargetPosition',
      serviceType: 'LockMechanism',
      serviceName: 'Shed Light',
      description: 'On',
      value: 0,
      format: 'bool',
      perms: ['ev', 'pr', 'pw'],
      unit: undefined,
      maxValue: undefined,
      minValue: undefined,
      minStep: undefined,
      canRead: true,
      canWrite: true,
      ev: true,
      setValue,
      getValue,
    },
    {
      aid: 13,
      iid: 10,
      uuid: '0000006D-0000-1000-8000-0026BB765291',
      type: 'CurrentPosition',
      serviceType: 'LockMechanism',
      serviceName: 'Shed Light',
      description: 'On',
      value: 0,
      format: 'bool',
      perms: ['ev', 'pr', 'pw'],
      unit: undefined,
      maxValue: undefined,
      minValue: undefined,
      minStep: undefined,
      canRead: true,
      canWrite: true,
      ev: true,
      setValue,
      getValue,
    },
    {
      aid: 13,
      iid: 11,
      uuid: '000000E3-0000-1000-8000-0026BB765291',
      type: 'ConfiguredName',
      serviceType: 'LockMechanism',
      serviceName: 'Shed Light',
      description: 'Configured Name',
      value: 'Shed Light',
      format: 'string',
      perms: ['ev', 'pr', 'pw'],
      unit: undefined,
      maxValue: undefined,
      minValue: undefined,
      minStep: undefined,
      canRead: true,
      canWrite: true,
      ev: true,
      setValue,
      getValue,
    },
    {
      aid: 13,
      iid: 11,
      uuid: Characteristic.LockCurrentState,
      type: 'LockCurrentState',
      serviceType: 'LockMechanism',
      serviceName: 'Shed Light',
      description: 'Configured Name',
      value: 1,
      format: 'string',
      perms: ['ev', 'pr', 'pw'],
      unit: undefined,
      maxValue: undefined,
      minValue: undefined,
      minStep: undefined,
      canRead: true,
      canWrite: true,
      ev: true,
      setValue,
      getValue,
    },

  ],
  accessoryInformation: {
    'Manufacturer': 'Tasmota',
    'Model': 'WiOn',
    'Name': 'Shed Light',
    'Serial Number': '02231D-jessie',
    'Firmware Revision': '9.5.0tasmota',
  },
  values: { On: 0, ConfiguredName: 'Shed Light' },
  linked: undefined,
  instance: {
    name: 'homebridge',
    username: '1C:22:3D:E3:CF:34',
    ipAddress: '192.168.1.11',
    port: 46283,
    connectionFailedCount: 0,
    services: [],
    configurationNumber: 1,
  },
  uniqueId: '664195d5556f1e0b424ed32bcd863ec8954c76f8ab81cc399f0e24f8827806d1',
  refreshCharacteristics,
  setCharacteristic,
  getCharacteristic,
};

const commandOnOff = {
  devices: [
    {
      customData: {
        aid: 75,
        iid: 8,
        instanceIpAddress: '192.168.1.11',
        instancePort: 46283,
        instanceUsername: '1C:22:3D:E3:CF:34',
      },
      id: 'b9245954ec41632a14076df3bbb7336f756c17ca4b040914a593e14d652d5738',
    },
  ],
  execution: [
    {
      command: 'action.devices.commands.OnOff',
      params: {
        on: true,
      },
    },
  ],
};

const commandOpenClose = {
  devices: [
    {
      customData: {
        aid: 75,
        iid: 8,
        instanceIpAddress: '192.168.1.11',
        instancePort: 46283,
        instanceUsername: '1C:22:3D:E3:CF:34',
      },
      id: 'b9245954ec41632a14076df3bbb7336f756c17ca4b040914a593e14d652d5738',
    },
  ],
  execution: [
    {
      command: 'action.devices.commands.OpenClose',
      params: {
        openPercent: 50,
      },
    },
  ],
};

const commandMalformed = {
  devices: [
    {
      customData: {
        aid: 75,
        iid: 8,
        instanceIpAddress: '192.168.1.11',
        instancePort: 46283,
        instanceUsername: '1C:22:3D:E3:CF:34',
      },
      id: 'b9245954ec41632a14076df3bbb7336f756c17ca4b040914a593e14d652d5738',
    },
  ],
  execution: [
  ],
};

const commandIncorrectCommand = {
  devices: [
    {
      customData: {
        aid: 75,
        iid: 8,
        instanceIpAddress: '192.168.1.11',
        instancePort: 46283,
        instanceUsername: '1C:22:3D:E3:CF:34',
      },
      id: 'b9245954ec41632a14076df3bbb7336f756c17ca4b040914a593e14d652d5738',
    },
  ],
  execution: [
    {
      command: 'action.devices.commands.notACommand',
      params: {
        on: true,
      },
    },
  ],
};

const commandBrightness = {
  devices: [
    {
      customData: {
        aid: 75,
        iid: 8,
        instanceIpAddress: '192.168.1.11',
        instancePort: 46283,
        instanceUsername: '1C:22:3D:E3:CF:34',
      },
      id: 'b9245954ec41632a14076df3bbb7336f756c17ca4b040914a593e14d652d5738',
    },
  ],
  execution: [
    {
      command: 'action.devices.commands.OnOff',
      params: {
        on: true,
      },
    },
  ],
};

const commandColorHSV = {
  devices: [
    {
      customData: {
        aid: 75,
        iid: 8,
        instanceIpAddress: '192.168.1.11',
        instancePort: 46283,
        instanceUsername: '1C:22:3D:E3:CF:34',
      },
      id: 'b9245954ec41632a14076df3bbb7336f756c17ca4b040914a593e14d652d5738',
    },
  ],
  execution: [
    {
      command: 'action.devices.commands.OnOff',
      params: {
        on: true,
      },
    },
  ],
};

const commandColorTemperature = {
  devices: [
    {
      customData: {
        aid: 75,
        iid: 8,
        instanceIpAddress: '192.168.1.11',
        instancePort: 46283,
        instanceUsername: '1C:22:3D:E3:CF:34',
      },
      id: 'b9245954ec41632a14076df3bbb7336f756c17ca4b040914a593e14d652d5738',
    },
  ],
  execution: [
    {
      command: 'action.devices.commands.OnOff',
      params: {
        on: true,
      },
    },
  ],
};

const commandLock = {
  devices: [
    {
      customData: {
        aid: 75,
        iid: 8,
        instanceIpAddress: '192.168.1.11',
        instancePort: 46283,
        instanceUsername: '1C:22:3D:E3:CF:34',
      },
      id: 'b9245954ec41632a14076df3bbb7336f756c17ca4b040914a593e14d652d5738',
    },
  ],
  execution: [
    {
      command: 'action.devices.commands.LockUnlock',
      params: {
        lock: true,
      },
    },
  ],
};

const commandUnlock = {
  devices: [
    {
      customData: {
        aid: 75,
        iid: 8,
        instanceIpAddress: '192.168.1.11',
        instancePort: 46283,
        instanceUsername: '1C:22:3D:E3:CF:34',
      },
      id: 'b9245954ec41632a14076df3bbb7336f756c17ca4b040914a593e14d652d5738',
    },
  ],
  execution: [
    {
      command: 'action.devices.commands.LockUnlock',
      params: {
        lock: false,
      },
    },
  ],
};
