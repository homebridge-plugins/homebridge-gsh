import { CharacteristicType, ServiceType } from '@homebridge/hap-client';
import { describe, expect, it } from 'vitest';
import { Characteristic } from '../hap-types';
import { SecuritySystem } from './security-system';
const securitySystem = new SecuritySystem();

describe('securitySystem', () => {
  describe('sync message', () => {
    it('securitySystem with On/Off only', async () => {
      const response: any = securitySystem.sync(securitySystemServiceOnOff);

      expect(response).toBeDefined();
      expect(response.type).toBe('action.devices.types.SECURITYSYSTEM');
      expect(response.traits).toContain('action.devices.traits.ArmDisarm');
      expect(response.traits).not.toContain('action.devices.traits.Brightness');
      expect(response.traits).not.toContain('action.devices.traits.ColorSetting');
      expect(response.attributes).toBeDefined();
      expect(response.name).toBeDefined();
      // await sleep(10000)
    });
  });
  describe('query message', () => {
    it('securitySystem with On/Off only', async () => {
      const response = securitySystem.query(securitySystemServiceOnOff);

      expect(response).toBeDefined();
      expect(response.online).toBeDefined();
      expect(response.isArmed).toBeDefined();

      // await sleep(10000)
    });
  });

  describe('execute message', () => {
    it('Arm', async () => {
      const response = await securitySystem.execute(securitySystemServiceOnOff, commandArm);
      expect(response).toBeDefined();
      expect(response.ids).toBeDefined();
      expect(response.status).toBe('SUCCESS');
      // await sleep(10000)
    });

    it('Disarm', async () => {
      const response = await securitySystem.execute(securitySystemServiceOnOff, commandDisarm);
      expect(response).toBeDefined();
      expect(response.ids).toBeDefined();
      expect(response.status).toBe('SUCCESS');
      // await sleep(10000)
    });

    it('securitySystem with On/Off only - commandMalformed', async () => {
      const response = await securitySystem.execute(securitySystemServiceOnOff, commandMalformed);
      expect(response).toBeDefined();
      expect(response.ids).toBeDefined();
      expect(response.status).toBe('ERROR');
    });

    it('securitySystem with On/Off only - commandIncorrectCommand', async () => {
      const response = await securitySystem.execute(securitySystemServiceOnOff, commandIncorrectCommand);
      expect(response).toBeDefined();
      expect(response.ids).toBeDefined();
      expect(response.status).toBe('ERROR');
    });

    it('securitySystem with On/Off only - Error', async () => {
      expect.assertions(1);
      securitySystemServiceOnOff.serviceCharacteristics[0].setValue = setValueError;
      await expect(securitySystem.execute(securitySystemServiceOnOff, commandArm)).rejects.toThrow('Error setting value');
      // await sleep(10000)
    });
  });

  describe('2 factor authentication', () => {
    it('twoFactorRequired should be set', async () => {
      expect(securitySystem.twoFactorRequired).toBeDefined();
      expect(securitySystem.twoFactorRequired).toBe(true);
    });

    it('Arm - does not request PIN', async () => {
      const response = await securitySystem.is2faRequired(commandArm);
      expect(response).toBeDefined();
      expect(response).toBe(false);
      // expect(response.ids).toBeDefined();
      // expect(response.status).toBe('SUCCESS');
    });

    it('Disarm - must request PIN', async () => {
      const response = await securitySystem.is2faRequired(commandDisarm);
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
    serviceType: 'SecuritySystem',
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
    serviceType: 'SecuritySystem',
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
  return securitySystemServiceOnOff;
};

const setCharacteristic = async function (value: string | number | boolean): Promise<ServiceType> {
  // Perform your operations here
  const result: CharacteristicType = {
    aid: 1,
    iid: 1,
    uuid: '00000025-0000-1000-8000-0026BB765291',
    type: 'On',
    serviceType: 'SecuritySystem',
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
  return securitySystemServiceOnOff;
};

const getCharacteristic = function (): CharacteristicType {
  // Perform your operations here
  const result: CharacteristicType = {
    aid: 1,
    iid: 1,
    uuid: '00000025-0000-1000-8000-0026BB765291',
    type: 'On',
    serviceType: 'SecuritySystem',
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

const securitySystemServiceOnOff: ServiceType = {
  aid: 13,
  iid: 8,
  uuid: '00000043-0000-1000-8000-0026BB765291',
  type: 'SecuritySystem',
  humanType: 'SecuritySystem',
  serviceName: 'Shed Light',
  serviceCharacteristics: [
    {
      aid: 13,
      iid: 11,
      uuid: Characteristic.SecuritySystemTargetState,
      type: 'SecuritySystemTargetState',
      serviceType: 'SecuritySystem',
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
      iid: 11,
      uuid: Characteristic.SecuritySystemCurrentState,
      type: 'SecuritySystemCurrentState',
      serviceType: 'SecuritySystem',
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
      serviceType: 'SecuritySystem',
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
      serviceType: 'SecuritySystem',
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
      serviceType: 'SecuritySystem',
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
      serviceType: 'SecuritySystem',
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
      serviceType: 'SecuritySystem',
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

const commandLockUnlock = {
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

const commandArm = {
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
      command: 'action.devices.commands.ArmDisarm',
      params: {
        arm: true,
        armLevel: 1,
      },
    },
  ],
};

const commandDisarm = {
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
      command: 'action.devices.commands.ArmDisarm',
      params: {
        arm: false,
        armLevel: 1,
        cancel: true,
      },
    },
  ],
};
