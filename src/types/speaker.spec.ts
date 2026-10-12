import { CharacteristicType, ServiceType } from '@homebridge/hap-client';
import { describe, expect, it } from 'vitest';
import { Hap } from '../hap';
import { PluginConfig } from '../interfaces';
import { Log } from '../logger';
import { Speaker } from './speaker';

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

const speaker = new Speaker(hap);

describe('speaker', () => {
  describe('sync message', () => {
    it('speaker', async () => {
      let response: any = speaker.sync(speakerServiceFull);
      expect(response).toBeDefined();
      expect(response.type).toBe('action.devices.types.SPEAKER');
      expect(response.traits).toContain('action.devices.traits.OnOff');
      expect(response.traits).toContain('action.devices.traits.Volume');
      expect(response.traits).toContain('action.devices.traits.TransportControl');
      expect(response.traits).toContain('action.devices.traits.MediaState');
      expect(response.traits).not.toContain('action.devices.traits.Brightness');
      expect(response.traits).not.toContain('action.devices.traits.ColorSetting');
      expect(response.attributes?.commandOnlyOnOff).toBe(false);
      expect(response.attributes?.queryOnlyOnOff).toBe(false);
      expect(response.attributes?.volumeCanMuteAndUnmute).toBe(true);
      expect(response.attributes).toHaveProperty('volumeMaxLevel');
      expect(response.attributes?.commandOnlyVolume).toBe(true);

      response = speaker.sync(speakerServiceMin);
      expect(response).toBeDefined();
      expect(response.type).toBe('action.devices.types.SPEAKER');
      expect(response.traits).toContain('action.devices.traits.OnOff');
      expect(response.traits).toContain('action.devices.traits.Volume');
      expect(response.traits).toContain('action.devices.traits.TransportControl');
      expect(response.traits).toContain('action.devices.traits.MediaState');
      expect(response.traits).not.toContain('action.devices.traits.Brightness');
      expect(response.traits).not.toContain('action.devices.traits.ColorSetting');
      expect(response.attributes?.commandOnlyOnOff).toBe(false);
      expect(response.attributes?.queryOnlyOnOff).toBe(true);
      expect(response.attributes?.volumeCanMuteAndUnmute).toBe(false);
      expect(response.attributes).toHaveProperty('volumeMaxLevel');
      expect(response.attributes?.commandOnlyVolume).toBe(true);
      // await sleep(10000)
    });
  });
  describe('query message', () => {
    it('speaker', async () => {
      let response: any = speaker.query(speakerServiceFull);
      expect(response).toBeDefined();
      expect(response).toHaveProperty('on');
      expect(response).toHaveProperty('currentVolume');
      expect(response).toHaveProperty('isMuted');
      expect(response).toHaveProperty('playbackState');

      response = speaker.query(speakerServiceMin);
      expect(response).toBeDefined();
      expect(response).toHaveProperty('on');
      expect(response).toHaveProperty('currentVolume');
      expect(response).toHaveProperty('isMuted');
      expect(response).toHaveProperty('playbackState');

      // await sleep(10000)
    });
  });

  describe('execute message', () => {
    it('speaker On/Off', async () => {
      let response: any = await speaker.execute(speakerServiceFull, commandOnOff);
      expect(response).toBeDefined();
      expect(response.ids).toBeDefined();
      expect(response.status).toBe('SUCCESS');

      response = await speaker.execute(speakerServiceMin, commandOnOff);
      expect(response).toBeDefined();
      expect(response.ids).toBeDefined();
      expect(response.status).toBe('ERROR');
      // await sleep(10000)
    });

    it('speaker mute', async () => {
      let response: any = await speaker.execute(speakerServiceFull, commandMute);
      expect(response).toBeDefined();
      expect(response.ids).toBeDefined();
      expect(response.status).toBe('SUCCESS');

      response = await speaker.execute(speakerServiceMin, commandMute);
      expect(response).toBeDefined();
      expect(response.ids).toBeDefined();
      expect(response.status).toBe('ERROR');
      // await sleep(10000)
    });

    it('speaker volume up/down', async () => {
      let response: any = await speaker.execute(speakerServiceFull, commandVolumeUp);
      expect(response).toBeDefined();
      expect(response.ids).toBeDefined();
      expect(response.status).toBe('SUCCESS');

      speakerServiceFull.serviceCharacteristics.find(x => x.type === 'Volume').value = 100;
      response = await speaker.execute(speakerServiceFull, commandVolumeUp);
      expect(response).toBeDefined();
      expect(response.ids).toBeDefined();
      expect(response.errorCode).toBe('volumeAlreadyMax');
      expect(response.status).toBe('ERROR');

      response = await speaker.execute(speakerServiceFull, commandVolumeDown);
      expect(response).toBeDefined();
      expect(response.ids).toBeDefined();
      expect(response.status).toBe('SUCCESS');

      speakerServiceFull.serviceCharacteristics.find(x => x.type === 'Volume').value = 0;
      response = await speaker.execute(speakerServiceFull, commandVolumeDown);
      expect(response).toBeDefined();
      expect(response.ids).toBeDefined();
      expect(response.errorCode).toBe('volumeAlreadyMin');
      expect(response.status).toBe('ERROR');

      response = await speaker.execute(speakerServiceMin, commandVolumeDown);
      expect(response).toBeDefined();
      expect(response.ids).toBeDefined();
      expect(response.status).toBe('ERROR');
      // await sleep(10000)
    });

    it('speaker set volume', async () => {
      let response: any = await speaker.execute(speakerServiceFull, commandSetVolume);
      expect(response).toBeDefined();
      expect(response.ids).toBeDefined();
      expect(response.status).toBe('SUCCESS');

      response = await speaker.execute(speakerServiceMin, commandSetVolume);
      expect(response).toBeDefined();
      expect(response.ids).toBeDefined();
      expect(response.status).toBe('ERROR');
      // await sleep(10000)
    });

    it('speaker pause', async () => {
      let response: any = await speaker.execute(speakerServiceFull, commandPause);
      expect(response).toBeDefined();
      expect(response.ids).toBeDefined();
      expect(response.status).toBe('SUCCESS');

      response = await speaker.execute(speakerServiceMin, commandPause);
      expect(response).toBeDefined();
      expect(response.ids).toBeDefined();
      expect(response.status).toBe('SUCCESS');
      // await sleep(10000)
    });

    it('speaker resume', async () => {
      let response: any = await speaker.execute(speakerServiceFull, commandResume);
      expect(response).toBeDefined();
      expect(response.ids).toBeDefined();
      expect(response.status).toBe('SUCCESS');

      response = await speaker.execute(speakerServiceMin, commandResume);
      expect(response).toBeDefined();
      expect(response.ids).toBeDefined();
      expect(response.status).toBe('SUCCESS');
      // await sleep(10000)
    });

    it('speaker stop', async () => {
      let response: any = await speaker.execute(speakerServiceFull, commandStop);
      expect(response).toBeDefined();
      expect(response.ids).toBeDefined();
      expect(response.status).toBe('SUCCESS');

      response = await speaker.execute(speakerServiceMin, commandStop);
      expect(response).toBeDefined();
      expect(response.ids).toBeDefined();
      expect(response.status).toBe('SUCCESS');
      // await sleep(10000)
    });

    it('speaker - commandIncorrectCommand', async () => {
      const response = await speaker.execute(speakerServiceFull, commandIncorrectCommand);
      expect(response).toBeDefined();
      expect(response.ids).toBeDefined();
      expect(response.status).toBe('ERROR');
    });

    it('speaker - Error', async () => {
      expect.assertions(1);
      speakerServiceFull.serviceCharacteristics[0].setValue = setValueError;
      await expect(speaker.execute(speakerServiceFull, commandOnOff)).rejects.toThrow('Error setting value');
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
    serviceType: 'Speaker',
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
    serviceType: 'Speaker',
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
  return speakerServiceFull;
};

const setCharacteristic = async function (value: string | number | boolean): Promise<ServiceType> {
  // Perform your operations here
  const result: CharacteristicType = {
    aid: 1,
    iid: 1,
    uuid: '00000025-0000-1000-8000-0026BB765291',
    type: 'On',
    serviceType: 'Speaker',
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
  return speakerServiceFull;
};

const getCharacteristic = function (): CharacteristicType {
  // Perform your operations here
  const result: CharacteristicType = {
    aid: 1,
    iid: 1,
    uuid: '00000025-0000-1000-8000-0026BB765291',
    type: 'On',
    serviceType: 'Speaker',
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

const speakerServiceFull: ServiceType = {
  aid: 23,
  iid: 8,
  uuid: '00000228-0000-1000-8000-0026BB765291',
  type: 'SmartSpeaker',
  humanType: 'Smart Speaker',
  serviceName: 'Shed Light',
  serviceCharacteristics: [
    {
      aid: 23,
      iid: 12,
      uuid: '000000B0-0000-1000-8000-0026BB765291',
      type: 'Active',
      serviceType: 'SmartSpeaker',
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
      aid: 23,
      iid: 18,
      uuid: '000000EA-0000-1000-8000-0026BB765291',
      type: 'VolumeSelector',
      serviceType: 'SmartSpeaker',
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
      aid: 23,
      iid: 9,
      uuid: '000000E0-0000-1000-8000-0026BB765291',
      type: 'CurrentMediaState',
      serviceType: 'SmartSpeaker',
      serviceName: 'Shed Light',
      description: 'Current Media State',
      value: 1,
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
      aid: 23,
      iid: 10,
      uuid: '00000137-0000-1000-8000-0026BB765291',
      type: 'TargetMediaState',
      serviceType: 'SmartSpeaker',
      serviceName: 'Shed Light',
      description: 'Target Media State',
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
      aid: 23,
      iid: 16,
      uuid: '0000011A-0000-1000-8000-0026BB765291',
      type: 'Mute',
      serviceType: 'SmartSpeaker',
      serviceName: 'Shed Light',
      description: 'Mute',
      value: 0,
      format: 'bool',
      perms: ['ev', 'pr', 'pw'],
      canRead: true,
      canWrite: true,
      ev: true,
      setValue,
      getValue,
    },
    {
      aid: 23,
      iid: 17,
      uuid: '00000119-0000-1000-8000-0026BB765291',
      type: 'Volume',
      serviceType: 'SmartSpeaker',
      serviceName: 'Shed Light',
      description: 'Volume',
      value: 50,
      format: 'uint8',
      perms: ['ev', 'pr', 'pw'],
      unit: 'percentage',
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
  values: {
    CurrentMediaState: 1,
    TargetMediaState: 1,
    Active: 1,
    Mute: 0,
    Volume: 50,
  },
  instance: {
    name: 'homebridge',
    username: '1C:22:3D:E3:CF:34',
    ipAddress: '192.168.1.11',
    port: 46283,
    connectionFailedCount: 0,
    services: [],
    configurationNumber: 1,
  },
  uniqueId: '664195d5556f1e0b424ed32bcd863ec8954c76f8ab81cc399f0e24f8827806d3',
  refreshCharacteristics,
  setCharacteristic,
  getCharacteristic,
}

const speakerServiceMin: ServiceType = {
  aid: 33,
  iid: 8,
  uuid: '00000228-0000-1000-8000-0026BB765291',
  type: 'SmartSpeaker',
  humanType: 'Smart Speaker',
  serviceName: 'Shed Light',
  serviceCharacteristics: [
    {
      aid: 33,
      iid: 9,
      uuid: '000000E0-0000-1000-8000-0026BB765291',
      type: 'CurrentMediaState',
      serviceType: 'SmartSpeaker',
      serviceName: 'Shed Light',
      description: 'Current Media State',
      value: 1,
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
      aid: 33,
      iid: 10,
      uuid: '00000137-0000-1000-8000-0026BB765291',
      type: 'TargetMediaState',
      serviceType: 'SmartSpeaker',
      serviceName: 'Shed Light',
      description: 'Target Media State',
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
  ],
  accessoryInformation: {
    'Manufacturer': 'Tasmota',
    'Model': 'WiOn',
    'Name': 'Shed Light',
    'Serial Number': '02231D-jessie',
    'Firmware Revision': '9.5.0tasmota',
  },
  values: {
    CurrentMediaState: 1,
    TargetMediaState: 1,
    Volume: 50,
    StatusActive: 1,
  },
  instance: {
    name: 'homebridge',
    username: '1C:22:3D:E3:CF:34',
    ipAddress: '192.168.1.11',
    port: 46283,
    connectionFailedCount: 0,
    services: [],
    configurationNumber: 1,
  },
  uniqueId: '664195d5556f1e0b424ed32bcd863ec8954c76f8ab81cc399f0e24f8827806d4',
  refreshCharacteristics,
  setCharacteristic,
  getCharacteristic,
}

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
        relativeSteps: 10,
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
        relativeSteps: -10,
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
        volumeLevel: 20,
      },
    },
  ],
};

const commandResume = {
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
      command: 'action.devices.commands.mediaResume',
      params: {
      },
    },
  ],
};

const commandPause = {
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
      command: 'action.devices.commands.mediaPause',
      params: {
      },
    },
  ],
};

const commandStop = {
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
      command: 'action.devices.commands.mediaStop',
      params: {
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
