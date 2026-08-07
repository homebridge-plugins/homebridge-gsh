import { CharacteristicType, ServiceType } from '@homebridge/hap-client';
import { afterAll, describe, expect, it } from 'vitest';
import { Hap } from '../hap';
import { PluginConfig } from '../interfaces';
import { Log } from '../logger';
import { TemperatureSensor } from './temperature-sensor';

class socketMock {
  on(event: string, callback: any) {
    if (event === 'websocket-status') {
      callback('websocket-status');
    }
    if (event === 'json') {
      callback({ serverMessage: 'serverMessage' });
    }
  }

  sendJson(data: any) {
    // eslint-disable-next-line no-console
    console.log('sendJson', data);
  }
}

const config: PluginConfig = {
  name: 'Google Smart Home',
  token: '1234567890',
  notice: 'Keep your token a secret!',
  debug: false,
  platform: 'google-smarthome',
  twoFactorAuthPin: '123-456',
};

const log = new Log(console, true);

const hap = new Hap(socketMock, log, '031-45-154', config, {});

const temperatureSensor = new TemperatureSensor(hap);
// https://developers.home.google.com/cloud-to-cloud/intents/sync

describe('temperatureSensor', () => {
  describe('sync message', () => {
    it('temperatureSensor', async () => {
      const response: any = temperatureSensor.sync(temperatureSensorTemp);
      expect(response).toBeDefined();
      expect(response.name).toBeDefined();
      expect(response.name.defaultNames).toBeDefined();
      expect(response.name.defaultNames).toHaveLength(2);
      expect(response.name.name).toBeDefined();
      expect(response.name.name).not.toBe('');
      expect(response.name.name).toBe('Backyard');
      expect(response.name.nicknames).toBeDefined();  //
      expect(response.type).toBe('action.devices.types.SENSOR');
      expect(response.traits).toContain('action.devices.traits.TemperatureControl');
      expect(response.traits).not.toContain('action.devices.traits.Brightness');
      expect(response.traits).not.toContain('action.devices.traits.ColorSetting');
      expect(response.attributes).toBeDefined();
      expect(response.attributes.queryOnlyTemperatureControl).toBeDefined();
      expect(response.attributes.temperatureUnitForUX).toBeDefined();
      // await sleep(10000)
    });
    it('temperatureSensor - No Service Name', async () => {
      temperatureSensorTemp.serviceName = '';
      const response: any = temperatureSensor.sync(temperatureSensorTemp);
      expect(response).toBeDefined();
      expect(response.name).toBeDefined();
      expect(response.name.defaultNames).toBeDefined();
      expect(response.name.defaultNames).toHaveLength(1);
      expect(response.name.name).toBeDefined();
      expect(response.name.name).not.toBe('');
      expect(response.name.name).toBe('Backyard');
      expect(response.name.nicknames).toBeDefined();  //
      expect(response.type).toBe('action.devices.types.SENSOR');
      expect(response.traits).toContain('action.devices.traits.TemperatureControl');
      expect(response.traits).not.toContain('action.devices.traits.Brightness');
      expect(response.traits).not.toContain('action.devices.traits.ColorSetting');
      expect(response.attributes).toBeDefined();
      expect(response.attributes.queryOnlyTemperatureControl).toBeDefined();
      expect(response.attributes.temperatureUnitForUX).toBeDefined();
      // await sleep(10000)
    });
    it('temperatureSensor - No service or Accessory Name', async () => {
      temperatureSensorTemp.accessoryInformation.Name = '';
      const response: any = temperatureSensor.sync(temperatureSensorTemp);
      expect(response).toBeDefined();
      expect(response.name).toBeDefined();
      expect(response.name.defaultNames).toBeDefined();
      expect(response.name.defaultNames).toHaveLength(0);
      expect(response.name.name).toBeDefined();
      expect(response.name.name).not.toBe('');
      expect(response.name.name).toBe('Missing Name');
      expect(response.name.nicknames).toBeDefined();  //
      expect(response.type).toBe('action.devices.types.SENSOR');
      expect(response.traits).toContain('action.devices.traits.TemperatureControl');
      expect(response.traits).not.toContain('action.devices.traits.Brightness');
      expect(response.traits).not.toContain('action.devices.traits.ColorSetting');
      expect(response.attributes).toBeDefined();
      expect(response.attributes.queryOnlyTemperatureControl).toBeDefined();
      expect(response.attributes.temperatureUnitForUX).toBeDefined();
      // await sleep(10000)
    });
  });

  describe('query message', () => {
    it('temperatureSensor ', async () => {
      const response = temperatureSensor.query(temperatureSensorTemp);
      expect(response).toBeDefined();
      expect(response.temperatureSetpointCelsius).toBeDefined();
      expect(response.temperatureAmbientCelsius).toBeDefined();
      expect(response.online).toBeDefined();
      // await sleep(10000)
    });
  });

  describe('execute message', () => {
    it('temperatureSensor ', async () => {
      const response = await temperatureSensor.execute(temperatureSensorTemp, commandOnOff);
      expect(response).toBeDefined();
      expect(response.ids).toBeDefined();
      expect(response.status).toBe('ERROR');
      // await sleep(10000)
    });

    it('temperatureSensor  - commandMalformed', async () => {
      const response = await temperatureSensor.execute(temperatureSensorTemp, commandMalformed);
      expect(response).toBeDefined();
      expect(response.ids).toBeDefined();
      expect(response.status).toBe('ERROR');
    });

    it('temperatureSensor  - commandIncorrectCommand', async () => {
      const response = await temperatureSensor.execute(temperatureSensorTemp, commandIncorrectCommand);
      expect(response).toBeDefined();
      expect(response.ids).toBeDefined();
      expect(response.status).toBe('ERROR');
    });

    /*
    test('TemperatureSensor  - Error', async () => {
      expect.assertions(1);
      temperatureSensorTemp.serviceCharacteristics[0].setValue = setValueError;
      await expect(temperatureSensor.execute(temperatureSensorTemp, commandOnOff)).rejects.toThrow('Error setting value');
      // await sleep(10000)
    });
    */
  });
  afterAll(async () => {
    // eslint-disable-next-line no-console
    console.log('destroy');
    await hap.destroy();
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
    serviceType: 'TemperatureSensor',
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
    serviceType: 'TemperatureSensor',
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
  return temperatureSensorTemp;
};

const setCharacteristic = async function (value: string | number | boolean): Promise<ServiceType> {
  // Perform your operations here
  const result: CharacteristicType = {
    aid: 1,
    iid: 1,
    uuid: '00000025-0000-1000-8000-0026BB765291',
    type: 'On',
    serviceType: 'TemperatureSensor',
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
  return temperatureSensorTemp;
};

const getCharacteristic = function (): CharacteristicType {
  // Perform your operations here
  const result: CharacteristicType = {
    aid: 1,
    iid: 1,
    uuid: '00000025-0000-1000-8000-0026BB765291',
    type: 'On',
    serviceType: 'TemperatureSensor',
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

const temperatureSensorTemp: ServiceType = {
  'aid': 23,
  'iid': 10,
  'uuid': '0000008A-0000-1000-8000-0026BB765291',
  'type': 'TemperatureSensor',
  'humanType': 'Temperature Sensor',
  'serviceName': 'Backyard',
  'serviceCharacteristics': [
    {
      'aid': 23,
      'iid': 312,
      'uuid': '00000079-0000-1000-8000-0026BB765291',
      'type': 'StatusLowBattery',
      'serviceType': 'TemperatureSensor',
      'serviceName': '',
      'description': 'Status Low Battery',
      'value': 0,
      'format': 'uint8',
      'perms': [
        'ev',
        'pr',
      ],
      'maxValue': 1,
      'minValue': 0,
      'minStep': 1,
      'canRead': true,
      'canWrite': false,
      'ev': true,
    },
    {
      'aid': 23,
      'iid': 12,
      'uuid': '00000011-0000-1000-8000-0026BB765291',
      'type': 'CurrentTemperature',
      'serviceType': 'TemperatureSensor',
      'serviceName': '',
      'description': 'Current Temperature',
      'value': 0,
      'format': 'float',
      'perms': [
        'ev',
        'pr',
      ],
      'unit': 'celsius',
      'maxValue': 100,
      'minValue': -100,
      'minStep': 0.1,
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
    'StatusLowBattery': 0,
    'CurrentTemperature': 0,
  },
  'linked': [
    13,
  ],
  'instance': {
    'name': 'Default Model',
    'username': '69:62:B7:AE:38:D4',
    'ipAddress': '192.168.1.11',
    'port': 51830,
    connectionFailedCount: 0,
    services: [],
    configurationNumber: 1,
  },
  'uniqueId': '49c24a777f09eddbe4579d8d9432a8f313d1d90d5c4a3ac8ff018be24469c7e2',
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
