import { CharacteristicType, ServiceType } from '@homebridge/hap-client';
import { describe, expect, it } from 'vitest';
import { HumiditySensor } from './humidity-sensor';
const humiditySensor = new HumiditySensor();

describe('humiditySensor', () => {
  describe('sync message', () => {
    it('humiditySensor ', async () => {
      const response: any = humiditySensor.sync(humiditySensorTemp);
      expect(response).toBeDefined();
      expect(response.name).toBeDefined();
      expect(response.name.defaultNames).toBeDefined();
      expect(response.name.defaultNames).toHaveLength(2);
      expect(response.name.name).toBeDefined();
      expect(response.name.name).not.toBe('');
      expect(response.name.name).toBe('Backyard');
      expect(response.name.nicknames).toBeDefined();  //
      expect(response.type).toBe('action.devices.types.SENSOR');
      expect(response.traits).toContain('action.devices.traits.HumiditySetting');
      expect(response.traits).not.toContain('action.devices.traits.Brightness');
      expect(response.traits).not.toContain('action.devices.traits.ColorSetting');
      expect(response.attributes).toBeDefined();
      expect(response.attributes.queryOnlyHumiditySetting).toBeDefined();
      // await sleep(10000)
    });
    it('humiditySensor - No Service Name', async () => {
      humiditySensorTemp.serviceName = '';
      const response: any = humiditySensor.sync(humiditySensorTemp);
      expect(response).toBeDefined();
      expect(response).toBeDefined();
      expect(response.name).toBeDefined();
      expect(response.name.defaultNames).toBeDefined();
      expect(response.name.defaultNames).toHaveLength(1);
      expect(response.name.name).toBeDefined();
      expect(response.name.name).not.toBe('');
      expect(response.name.name).toBe('Backyard');
      expect(response.name.nicknames).toBeDefined();  //
      expect(response.type).toBe('action.devices.types.SENSOR');
      expect(response.traits).toContain('action.devices.traits.HumiditySetting');
      expect(response.traits).not.toContain('action.devices.traits.Brightness');
      expect(response.traits).not.toContain('action.devices.traits.ColorSetting');
      expect(response.attributes).toBeDefined();
      expect(response.attributes.queryOnlyHumiditySetting).toBeDefined();
      // await sleep(10000)
    });
    it('humiditySensor - No service or Accessory Name', async () => {
      humiditySensorTemp.accessoryInformation.Name = '';
      const response: any = humiditySensor.sync(humiditySensorTemp);
      expect(response).toBeDefined();
      expect(response.name).toBeDefined();
      expect(response.name.defaultNames).toBeDefined();
      expect(response.name.defaultNames).toHaveLength(0);
      expect(response.name.name).toBeDefined();
      expect(response.name.name).not.toBe('');
      expect(response.name.name).toBe('Missing Name');
      expect(response.name.nicknames).toBeDefined();  //
      expect(response.type).toBe('action.devices.types.SENSOR');
      expect(response.traits).toContain('action.devices.traits.HumiditySetting');
      expect(response.traits).not.toContain('action.devices.traits.Brightness');
      expect(response.traits).not.toContain('action.devices.traits.ColorSetting');
      expect(response.attributes).toBeDefined();
      expect(response.attributes.queryOnlyHumiditySetting).toBeDefined();
      // await sleep(10000)
    });
  });
  describe('query message', () => {
    it('humiditySensor ', async () => {
      const response = humiditySensor.query(humiditySensorTemp);
      expect(response).toBeDefined();
      expect(response.humidityAmbientPercent).toBeDefined();
      expect(response.online).toBeDefined();
      // await sleep(10000)
    });
  });

  describe('execute message', () => {
    it('humiditySensor ', async () => {
      const response = await humiditySensor.execute(humiditySensorTemp, commandOnOff);
      expect(response).toBeDefined();
      expect(response.ids).toBeDefined();
      expect(response.status).toBe('ERROR');
      // await sleep(10000)
    });

    it('humiditySensor  - commandMalformed', async () => {
      const response = await humiditySensor.execute(humiditySensorTemp, commandMalformed);
      expect(response).toBeDefined();
      expect(response.ids).toBeDefined();
      expect(response.status).toBe('ERROR');
    });

    it('humiditySensor  - commandIncorrectCommand', async () => {
      const response = await humiditySensor.execute(humiditySensorTemp, commandIncorrectCommand);
      expect(response).toBeDefined();
      expect(response.ids).toBeDefined();
      expect(response.status).toBe('ERROR');
    });

    /*
    test('HumiditySensor  - Error', async () => {
      expect.assertions(1);
      humiditySensorServiceOnOff.serviceCharacteristics[0].setValue = setValueError;
      expect(humiditySensor.execute(humiditySensorServiceOnOff, commandOnOff)).rejects.toThrow('Error setting value');
      // await sleep(10000)
    });
    */
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
    serviceType: 'HumiditySensor',
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
  const result: CharacteristicType = {
    aid: 1,
    iid: 1,
    uuid: '00000025-0000-1000-8000-0026BB765291',
    type: 'On',
    serviceType: 'Lightbulb',
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

const getValue = async function (): Promise<CharacteristicType> {
  // Perform your operations here
  const result: CharacteristicType = {
    aid: 1,
    iid: 1,
    uuid: '00000025-0000-1000-8000-0026BB765291',
    type: 'On',
    serviceType: 'HumiditySensor',
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
  return humiditySensorServiceOnOff;
};

const setCharacteristic = async function (value: string | number | boolean): Promise<ServiceType> {
  // Perform your operations here
  const result: CharacteristicType = {
    aid: 1,
    iid: 1,
    uuid: '00000025-0000-1000-8000-0026BB765291',
    type: 'On',
    serviceType: 'HumiditySensor',
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
  return humiditySensorTemp;
};

const getCharacteristic = function (): CharacteristicType {
  // Perform your operations here
  const result: CharacteristicType = {
    aid: 1,
    iid: 1,
    uuid: '00000025-0000-1000-8000-0026BB765291',
    type: 'On',
    serviceType: 'HumiditySensor',
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

const humiditySensorTemp: ServiceType = {
  'aid': 23,
  'iid': 13,
  'uuid': '00000082-0000-1000-8000-0026BB765291',
  'type': 'HumiditySensor',
  'humanType': 'Humidity Sensor',
  'serviceName': 'Backyard',
  'serviceCharacteristics': [
    {
      'aid': 23,
      'iid': 15,
      'uuid': '00000010-0000-1000-8000-0026BB765291',
      'type': 'CurrentRelativeHumidity',
      'serviceType': 'HumiditySensor',
      'serviceName': '',
      'description': 'Current Relative Humidity',
      'value': 0,
      'format': 'float',
      'perms': [
        'ev',
        'pr',
      ],
      'unit': 'percentage',
      'maxValue': 100,
      'minValue': 0,
      'minStep': 1,
      'canRead': true,
      'canWrite': false,
      'ev': true,
    },
  ],
  'accessoryInformation': {
    'Manufacturer': 'NRCHKB',
    'Model': '1.4.3',
    'Name': 'Backyard',
    'Serial Number': 'Default Serial Number',
    'Firmware Revision': '1.4.3',
    'Hardware Revision': '1.4.3',
    'Software Revision': '1.4.3',
  },
  'values': {
    'CurrentRelativeHumidity': 0,
  },
  'instance': {
    'name': 'Default Model',
    'username': '69:62:B7:AE:38:D4',
    'ipAddress': '192.168.1.11',
    'port': 51830,
    connectionFailedCount: 0,
    services: [],
    configurationNumber: 1,
  },
  'uniqueId': '4a1df9989d8d4e7b440455f15d9bdd5326d81f80ccfa753499899864a5248657',
};

const humiditySensorServiceOnOff: ServiceType = {
  aid: 13,
  iid: 8,
  uuid: '00000043-0000-1000-8000-0026BB765291',
  type: 'HumiditySensor',
  humanType: 'HumiditySensor',
  serviceName: 'Shed Light',
  serviceCharacteristics: [
    {
      aid: 13,
      iid: 10,
      uuid: '00000025-0000-1000-8000-0026BB765291',
      type: 'On',
      serviceType: 'HumiditySensor',
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
      serviceType: 'HumiditySensor',
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

const humiditySensorServiceDimmer: ServiceType = {
  aid: 14,
  iid: 8,
  uuid: '00000043-0000-1000-8000-0026BB765291',
  type: 'HumiditySensor',
  humanType: 'HumiditySensor',
  serviceName: 'Front Hall',
  serviceCharacteristics: [
    {
      aid: 14,
      iid: 10,
      uuid: '00000025-0000-1000-8000-0026BB765291',
      type: 'On',
      serviceType: 'HumiditySensor',
      serviceName: 'Front Hall',
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
      aid: 14,
      iid: 11,
      uuid: '00000008-0000-1000-8000-0026BB765291',
      type: 'Brightness',
      serviceType: 'HumiditySensor',
      serviceName: 'Front Hall',
      description: 'Brightness',
      value: 100,
      format: 'int',
      perms: ['ev', 'pr', 'pw'],
      unit: 'percentage',
      maxValue: 100,
      minValue: 0,
      minStep: 1,
      canRead: true,
      canWrite: true,
      ev: true,
      setValue,
      getValue,
    },
    {
      aid: 14,
      iid: 12,
      uuid: '000000E3-0000-1000-8000-0026BB765291',
      type: 'ConfiguredName',
      serviceType: 'HumiditySensor',
      serviceName: 'Front Hall',
      description: 'Configured Name',
      value: 'Front Hall',
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
    'Model': 'Tuya MCU',
    'Name': 'Front Hall',
    'Serial Number': '23CAC5-jessie',
    'Firmware Revision': '9.5.0tasmota',
  },
  values: { On: 0, Brightness: 100, ConfiguredName: 'Front Hall' },
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
  uniqueId: '028fc478c0b4b116ead9be0dc8a72251b351b745cbc3961704268737101c803d',
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

const commandColorHumidity = {
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
