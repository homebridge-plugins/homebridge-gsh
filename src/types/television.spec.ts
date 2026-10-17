import { CharacteristicType, ServiceType } from '@homebridge/hap-client';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { Hap } from '../hap';
import { PluginConfig } from '../interfaces';
import { Log } from '../logger';
import { Television } from './television';


const socketMock = new class {
  on(event: string, callback: any) {
    if (event === 'websocket-status') {
      callback('websocket-status');
    }
    if (event === 'json') {
      callback({ serverMessage: 'serverMessage' });
    }
  }

  sendJson(data: any) {

    console.log('sendJson', data);
  }
};

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

describe('television', () => {
  describe('sync message', () => {
    it('television with On/Off only', async () => {
      hap.services = [  // initialize once
        televisionServiceOnOff,
        speakerService,
      ];
      const attributes = {
        'availableApplications': [],
        'commandOnlyOnOff': false,
        'queryOnlyOnOff': false,
        'supportActivityState': false,
        'supportPlaybackState': false,
        'transportControlSupportedCommands': [],
      };
      let response: any = hap.types[televisionServiceOnOff.type as keyof typeof hap.types].sync(televisionServiceOnOff);
      expect(response).toBeDefined();
      expect(response.type).toBe('action.devices.types.TV');
      expect(response.traits).toContain('action.devices.traits.OnOff');
      expect(response.traits).not.toContain('action.devices.traits.Volume');
      expect(response.traits).not.toContain('action.devices.traits.Brightness');
      expect(response.traits).not.toContain('action.devices.traits.ColorSetting');
      expect(response.attributes).toEqual(attributes);
      // await sleep(10000)

      response = hap.types[speakerService.type as keyof typeof hap.types].sync(speakerService);
      expect(response).toBeDefined();
      expect(response.id).toBe(televisionServiceOnOff.uniqueId);
      expect(response.type).toBe('action.devices.types.TV');
      expect(response.traits).toContain('action.devices.traits.Volume');
      expect(response.attributes).toHaveProperty('volumeCanMuteAndUnmute');
      expect(response.attributes).toHaveProperty('volumeMaxLevel');
      expect(response.attributes).toHaveProperty('commandOnlyVolume');
    });
  });
  describe('query message', () => {
    it('television with On/Off only', async () => {
      const response = hap.types[televisionServiceOnOff.type as keyof typeof hap.types].query(televisionServiceOnOff);
      expect(response).toBeDefined();
      expect(response.on).toBeDefined();
      expect(response.online).toBeDefined();
      // await sleep(10000)

      expect({...response, ...{id: televisionServiceOnOff.uniqueId}}).toEqual(
        hap.types[speakerService.type as keyof typeof hap.types].query(speakerService),
      );
    });
  });

  describe('report state', () => {
    beforeEach(() => {
      vi.spyOn(console, 'log').mockImplementation(() => {});
    });
    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('television with speaker', async () => {
      await hap.reportStateSubject.next(speakerService.uniqueId);
      await sleep(1000); // debounce time
      const stdout = vi.mocked(console.log).mock.calls;
      expect(stdout[0][0]).toContain('sendJson');
      expect(stdout[0][1].type).toBe('report-state');
      expect(stdout[0][1].body[televisionServiceOnOff.uniqueId].isMuted).toBe(true);
    });
  });

  describe('execute message', () => {
    it('television with On/Off only', async () => {
      const response = await hap.types[televisionServiceOnOff.type as keyof typeof hap.types].execute(televisionServiceOnOff, commandOnOff);
      expect(response).toBeDefined();
      expect(response.ids).toBeDefined();
      expect(response.status).toBe('SUCCESS');
      // await sleep(10000)
    });

    it('television with On/Off only - commandMalformed', async () => {
      const response = await hap.types[televisionServiceOnOff.type as keyof typeof hap.types].execute(televisionServiceOnOff, commandMalformed);
      expect(response).toBeDefined();
      expect(response.ids).toBeDefined();
      expect(response.status).toBe('ERROR');
    });

    it('television with On/Off only - commandIncorrectCommand', async () => {
      const response = await hap.types[televisionServiceOnOff.type as keyof typeof hap.types].execute(televisionServiceOnOff, commandIncorrectCommand);
      expect(response).toBeDefined();
      expect(response.ids).toBeDefined();
      expect(response.status).toBe('ERROR');
    });

    it('television with On/Off only - Error', async () => {
      expect.assertions(1);
      televisionServiceOnOff.serviceCharacteristics[0].setValue = setValueError;
      await expect(hap.types[televisionServiceOnOff.type as keyof typeof hap.types].execute(televisionServiceOnOff, commandOnOff))
        .rejects.toThrow('Error setting value');
      // await sleep(10000)
    });

    it('television with On/Off only - mute', async () => {
      const response = await hap.types[televisionServiceOnOff.type as keyof typeof hap.types].execute(televisionServiceOnOff, commandMute);
      expect(response).toBeDefined();
      expect(response.ids).toBeDefined();
      expect(response.status).toBe('SUCCESS');
      // await sleep(10000)
    });

    it('television with On/Off only - volume up', async () => {
      const response = await hap.types[televisionServiceOnOff.type as keyof typeof hap.types].execute(televisionServiceOnOff, commandVolumeUp);
      expect(response).toBeDefined();
      expect(response.ids).toBeDefined();
      expect(response.status).toBe('SUCCESS');
      // await sleep(10000)
    });

    it('television with On/Off only - volume down', async () => {
      const response = await hap.types[televisionServiceOnOff.type as keyof typeof hap.types].execute(televisionServiceOnOff, commandVolumeDown);
      expect(response).toBeDefined();
      expect(response.ids).toBeDefined();
      expect(response.status).toBe('SUCCESS');
      // await sleep(10000)
    });

    it('television with On/Off only - set volume', async () => {
      const response = await hap.types[televisionServiceOnOff.type as keyof typeof hap.types].execute(televisionServiceOnOff, commandSetVolume);
      expect(response).toBeDefined();
      expect(response.ids).toBeDefined();
      expect(response.status).toBe('ERROR');
      // await sleep(10000)
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
    serviceType: 'Television',
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
    serviceType: 'Television',
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
  return televisionServiceOnOff;
};

const setCharacteristic = async function (value: string | number | boolean): Promise<ServiceType> {
  // Perform your operations here
  const result: CharacteristicType = {
    aid: 1,
    iid: 1,
    uuid: '00000025-0000-1000-8000-0026BB765291',
    type: 'On',
    serviceType: 'Television',
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
  return televisionServiceOnOff;
};

const getCharacteristic = function (): CharacteristicType {
  // Perform your operations here
  const result: CharacteristicType = {
    aid: 1,
    iid: 1,
    uuid: '00000025-0000-1000-8000-0026BB765291',
    type: 'On',
    serviceType: 'Television',
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

const televisionServiceOnOff: ServiceType = {
  aid: 13,
  iid: 8,
  uuid: '00000043-0000-1000-8000-0026BB765291',
  type: 'Television',
  humanType: 'Television',
  serviceName: 'Shed Light',
  serviceCharacteristics: [
    {
      aid: 13,
      iid: 10,
      uuid: '000000B0-0000-1000-8000-0026BB765291',
      type: 'Active',
      serviceType: 'Television',
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
      serviceType: 'Television',
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

const speakerService: ServiceType = {
  aid: 13,
  iid: 9,
  uuid: '00000113-0000-1000-8000-0026BB765291',
  type: 'Speaker',
  humanType: 'Speaker',
  serviceName: 'Shed Light',
  serviceCharacteristics: [
    {
      aid: 13,
      iid: 22,
      uuid: '000000EA-0000-1000-8000-0026BB765291',
      type: 'VolumeSelector',
      serviceType: 'Speaker',
      serviceName: 'Shed Light',
      description: 'Volume Selector',
      format: 'uint8',
      perms: ['pw'],
      maxValue: undefined,
      minValue: undefined,
      minStep: undefined,
      canRead: false,
      canWrite: true,
      ev: false,
      setValue,
      getValue,
    },
    {
      aid: 13,
      iid: 20,
      uuid: '000000B0-0000-1000-8000-0026BB765291',
      type: 'Active',
      serviceType: 'Speaker',
      serviceName: 'Shed Light',
      description: 'Active',
      value: 1,
      format: 'uint8',
      perms: ['ev', 'pr', 'pw'],
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
      iid: 21,
      uuid: '000000E9-0000-1000-8000-0026BB765291',
      type: 'VolumeControlType',
      serviceType: 'Speaker',
      serviceName: 'Shed Light',
      description: 'Volume Control Type',
      value: 3,
      format: 'uint8',
      perms: ['ev', 'pr'],
      maxValue: undefined,
      minValue: undefined,
      minStep: undefined,
      canRead: true,
      canWrite: false,
      ev: true,
      setValue,
      getValue,
    },
    {
      aid: 13,
      iid: 19,
      uuid: '0000011A-0000-1000-8000-0026BB765291',
      type: 'Mute',
      serviceType: 'Speaker',
      serviceName: 'Shed Light',
      description: 'Mute',
      value: 1,
      format: 'bool',
      perms: ['ev', 'pr', 'pw'],
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
  values: { Active: 1, VolumeControlType: 3, Mute: 1 },
  instance: {
    name: 'homebridge',
    username: '1C:22:3D:E3:CF:34',
    ipAddress: '192.168.1.11',
    port: 46283,
    connectionFailedCount: 0,
    services: [],
    configurationNumber: 1,
  },
  uniqueId: '664195d5556f1e0b424ed32bcd863ec8954c76f8ab81cc399f0e24f8827806d2',
  refreshCharacteristics,
  setCharacteristic,
  getCharacteristic,
}

const televisionServiceDimmer: ServiceType = {
  aid: 14,
  iid: 8,
  uuid: '00000043-0000-1000-8000-0026BB765291',
  type: 'Television',
  humanType: 'Television',
  serviceName: 'Front Hall',
  serviceCharacteristics: [
    {
      aid: 14,
      iid: 10,
      uuid: '00000025-0000-1000-8000-0026BB765291',
      type: 'On',
      serviceType: 'Television',
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
      serviceType: 'Television',
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
      serviceType: 'Television',
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

const commandMute = {
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
      command: 'action.devices.commands.mute',
      params: {
        on: true,
      },
    },
  ],
};

const commandVolumeUp = {
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
      command: 'action.devices.commands.volumeRelative',
      params: {
        relativeSteps: 5,
      },
    },
  ],
};

const commandVolumeDown = {
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
      command: 'action.devices.commands.volumeRelative',
      params: {
        relativeSteps: -5,
      },
    },
  ],
};

const commandSetVolume = {
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
      command: 'action.devices.commands.setVolume',
      params: {
        volumeLevel: 15,
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
