import { CharacteristicType, ServiceType } from '@homebridge/hap-client';
import { SmartHomeV1QueryRequestDevices, SmartHomeV1SyncDevices } from 'actions-on-google';
import fs from 'fs';

import { afterAll, describe, expect, expectTypeOf, test } from 'vitest';
import { Hap } from './hap';
import { PluginConfig } from './interfaces';
import { Log } from './logger';

// socket, log, pin: string, config: PluginConfig

const trace: boolean = false; // set to true to enable trace logging

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

describe('hap', () => {
  describe('name filter', () => {
    const config: PluginConfig = {
      name: 'Google Smart Home',
      token: '1234567890',
      notice: 'Keep your token a secret!',
      debug: false,
      platform: 'google-smarthome',
      twoFactorAuthPin: '1234',
      accessoryFilter: [
        'West Bedroom',
        'Wasaga',
        'Garage Door',
      ],
      accessoryFilterInverse: true,

    };

    const log = new Log(console, true);

    const hap = new Hap(socketMock, log, '031-45-154', config, {});

    describe('process the QUERY intent', () => {
      test('wait for HAP to be Ready', async () => {
        while (!hap.ready) {
          // console.log('waiting for hap to be ready');
          await sleep(500);
        }
        // eslint-disable-next-line no-console
        // console.log('hap ready, testing started', hap.services);
      }, 30000);

      describe('QUERY message with delay to allow manual testing', () => {
        test('lightbulb with On/Off only', async () => {
          const response: any = await hap.query(query);
          // console.log('response', response);
        });
        test('sleeping', async () => {
          await sleep(5000);
        }, 30000);
        test('lightbulb with On/Off only', async () => {
          const response: any = await hap.query(query);
          // console.log('response', response);
        });
        test('sleeping', async () => {
          await sleep(5000);
        }, 30000);
        test('lightbulb with On/Off only', async () => {
          const response: any = await hap.query(query);
          // console.log('response', response);
        });
      });

    });

    describe('process the SYNC intent', () => {
      test('Wait for HAP to be Ready', async () => {
        while (!hap.ready) {
          // console.log('waiting for hap to be ready');
          await sleep(500);
        }
        // eslint-disable-next-line no-console
        console.log('hap ready, testing started');
      }, 30000);

      describe('SYNC', () => {
        test('Sync Response is proper and filtered', async () => {
          const response: any = await hap.buildSyncResponse();
          expectTypeOf<SmartHomeV1SyncDevices[]>(response);
          // console.log('response', JSON.stringify(response, null, 2));
          expect(response).toBeDefined();
          expect(response).toBeInstanceOf(Array);
          expect(response).toHaveLength(7);

          // The names should be sorted alphabetically, so we can check that the names are correct
          const expectedNames = [
            'Garage Door',
            'Shed Garage Door',
            'Shed Garage Door',
            'Wasaga',
            'Wasaga Doorbell',
            'West Bedroom',
            'West Bedroom Fan',
          ];

          const actualNames = response.map(device => device.name.name);
          // The names should be sorted alphabetically, so we can check that the names are correct
          expect([...actualNames].sort()).toEqual([...expectedNames].sort());

          if (trace) {
            fs.writeFileSync('buildSyncResponse.json', JSON.stringify(response, null, 2), 'utf8');
          }
          /*
         // await fs.writeFile('buildSyncResponse.json', JSON.stringify(response, null, 2), (err: any) => {
            if (err) {
              // eslint-disable-next-line no-console
              console.log(err);
            }
          });
          await fs.writeFile('services.json', JSON.stringify(hap.services, null, 2), (err: any) => {
            if (err) {
              // eslint-disable-next-line no-console
              console.log(err);
            }
          });
          */
          //      // console.log('response', response);
        });
      });

    });

    describe('execute', () => {
      test('Wait for HAP to be Ready', async () => {
        while (!hap.ready) {
          // console.log('waiting for hap to be ready');
          await sleep(500);
        }
        // eslint-disable-next-line no-console
        console.log('hap ready, testing started');
      }, 30000);

      test('Turn Off Light', async () => {
        const response: any = await hap.execute([executeLightOff]);
        // console.log('response', response);
        expect(response).toBeDefined();
        expect(response).toBeInstanceOf(Array);
        expect(response).toHaveLength(1);
        expect(response[0].status).toBe('SUCCESS');
      });
    });
    describe('Garage Door 2fa and PIN Code', () => {
      test('Close - 2fa not Required', async () => {
        const response: any = await hap.execute([executeGarageClose]);
        // console.log('response', response);
        expect(response).toBeDefined();
        expect(response).toBeInstanceOf(Array);
        expect(response).toHaveLength(1);
        expect(response[0].status).toBe('SUCCESS');
      });

      /*
      [
        {
          ids: [
            '89e83c9cf95eb2ab26f02601a84cf42e6a05ab4b5a075b8f2ea43e3e0d2d7d2f'
          ],
          status: 'ERROR',
          errorCode: 'challengeNeeded',
          challengeNeeded: { type: 'pinNeeded' }
        }
      ] */

      test('Open - 2fa Required - No Pin', async () => {
        const response: any = await hap.execute([executeGarageOpen]);
        // console.log('response', response);
        expect(response).toBeDefined();
        expect(response).toBeInstanceOf(Array);
        expect(response).toHaveLength(1);
        expect(response[0].status).toBe('ERROR');
        expect(response[0].errorCode).toBe('challengeNeeded');
        expect(response[0].challengeNeeded).toBeDefined();
        expect(response[0].challengeNeeded.type).toBeDefined();
        expect(response[0].challengeNeeded.type).toBe('pinNeeded');
      });

      test('Open - 2fa Required - incorrect PIN', async () => {
        const response: any = await hap.execute([executeGarageDoorOpenWithIncorrectPin]);
        // console.log('response', response);
        expect(response).toBeDefined();
        expect(response).toBeInstanceOf(Array);
        expect(response).toHaveLength(1);
        expect(response[0].status).toBe('ERROR');
        expect(response[0].errorCode).toBe('challengeNeeded');
        expect(response[0].challengeNeeded).toBeDefined();
        expect(response[0].challengeNeeded.type).toBeDefined();
        expect(response[0].challengeNeeded.type).toBe('pinNeeded');
      });

      test.skip('Open - 2fa Required - correct PIN', async () => {
        const response: any = await hap.execute([executeGarageDoorOpenWithCorrectPin]);
        // console.log('response', response);
        expect(response).toBeDefined();
        expect(response).toBeInstanceOf(Array);
        expect(response).toHaveLength(1);
        expect(response[0].status).toBe('SUCCESS');
      });

      test('Close - 2fa not Required', async () => {
        // await sleep(5000); // wait for the door to open
        const response: any = await hap.execute([executeGarageClose]);
        // console.log('response', response);
        expect(response).toBeDefined();
        expect(response).toBeInstanceOf(Array);
        expect(response).toHaveLength(1);
        expect(response[0].status).toBe('SUCCESS');
      }, 10000);
    });

    afterAll(async () => {
      // eslint-disable-next-line no-console
      console.log('destroy');
      await hap.destroy();
    });
  });

  describe('reg exp filter', () => {
    const config: PluginConfig = {
      name: 'Google Smart Home',
      token: '1234567890',
      notice: 'Keep your token a secret!',
      debug: false,
      platform: 'google-smarthome',
      twoFactorAuthPin: '1234',
      accessoryFilter: [
        'Bedroom',
      ],
      accessoryFilterInverse: true,

    };

    const log = new Log(console, true);

    const hap = new Hap(socketMock, log, '031-45-154', config, {});

    describe('process the QUERY intent', () => {
      test('wait for HAP to be Ready', async () => {
        while (!hap.ready) {
          // console.log('waiting for hap to be ready');
          await sleep(500);
        }
        // eslint-disable-next-line no-console
        // console.log('hap ready, testing started', hap.services);
      }, 30000);
    });

    describe('process the SYNC intent', () => {
      test('Wait for HAP to be Ready', async () => {
        while (!hap.ready) {
          // console.log('waiting for hap to be ready');
          await sleep(500);
        }
        // eslint-disable-next-line no-console
        console.log('hap ready, testing started');
      }, 30000);

      describe('SYNC Response', () => {
        test('Sync Response is proper and filtered', async () => {
          const response: any = await hap.buildSyncResponse();
          expectTypeOf<SmartHomeV1SyncDevices[]>(response);
          expect(response).toBeDefined();
          expect(response).toBeInstanceOf(Array);
          expect(response).toHaveLength(4);

          const expectedNames = [
            'East Bedroom',
            'East Bedroom Fan',
            'West Bedroom',
            'West Bedroom Fan',
          ];

          const actualNames = response.map(device => device.name.name);
          expect(actualNames).toEqual(expectedNames);

          if (trace) {
            fs.writeFileSync('buildSyncResponse.json', JSON.stringify(response, null, 2), 'utf8');
          }
          /*
         // await fs.writeFile('buildSyncResponse.json', JSON.stringify(response, null, 2), (err: any) => {
            if (err) {
              // eslint-disable-next-line no-console
              console.log(err);
            }
          });
          await fs.writeFile('services.json', JSON.stringify(hap.services, null, 2), (err: any) => {
            if (err) {
              // eslint-disable-next-line no-console
              console.log(err);
            }
          });
          */
          //      // console.log('response', response);
        });
      });

    });

    afterAll(async () => {
      // eslint-disable-next-line no-console
      console.log('destroy');
      await hap.destroy();
    });
  });
});
async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// West Bedroom
const executeLightOff =
{
  'devices': [
    {
      'customData': {
        'aid': 75,
        'iid': 8,
        'instanceIpAddress': '192.168.1.11',
        'instancePort': 42909,
        'instanceUsername': '1C:22:3D:E3:CF:34',
      },
      'id': '00d36bc776a09f43f08a3e5ebb6b70d645d94029e98b199aebe6eb84b44fcaf3',
    },
  ],
  'execution': [
    {
      'command': 'action.devices.commands.OnOff',
      'params': {
        'on': false,
      },
    },
  ],
};

const executeGarageOpen =
{
  'devices': [
    {
      'customData': {
        'aid': 5,
        'iid': 8,
        'instanceIpAddress': '192.168.1.11',
        'instancePort': 42909,
        'instanceUsername': '1C:22:3D:E3:CF:34',
      },
      'id': '89e83c9cf95eb2ab26f02601a84cf42e6a05ab4b5a075b8f2ea43e3e0d2d7d2f',
    },
  ],
  'execution': [
    {
      'command': 'action.devices.commands.OpenClose',
      'params': {
        'followUpToken': '1234567890',
        'openPercent': 100,
      },
    },
  ],
};

const executeGarageDoorOpenWithIncorrectPin =
{
  'devices': [
    {
      'customData': {
        'aid': 5,
        'iid': 8,
        'instanceIpAddress': '192.168.1.11',
        'instancePort': 42909,
        'instanceUsername': '1C:22:3D:E3:CF:34',
      },
      'id': '89e83c9cf95eb2ab26f02601a84cf42e6a05ab4b5a075b8f2ea43e3e0d2d7d2f',
    },
  ],
  'execution': [
    {
      'challenge': {
        'pin': '54321',
      },
      'command': 'action.devices.commands.OpenClose',
      'params': {
        'followUpToken': '1234567890',
        'openPercent': 100,
      },
    },
  ],
};

const executeGarageDoorOpenWithCorrectPin =
{
  'devices': [
    {
      'customData': {
        'aid': 5,
        'iid': 8,
        'instanceIpAddress': '192.168.1.11',
        'instancePort': 42909,
        'instanceUsername': '1C:22:3D:E3:CF:34',
      },
      'id': '89e83c9cf95eb2ab26f02601a84cf42e6a05ab4b5a075b8f2ea43e3e0d2d7d2f',
    },
  ],
  'execution': [
    {
      'challenge': {
        'pin': '1234',
      },
      'command': 'action.devices.commands.OpenClose',
      'params': {
        'followUpToken': '1234567890',
        'openPercent': 100,
      },
    },
  ],
};

const executeGarageClose =
{
  'devices': [
    {
      'customData': {
        'aid': 5,
        'iid': 8,
        'instanceIpAddress': '192.168.1.11',
        'instancePort': 42909,
        'instanceUsername': '1C:22:3D:E3:CF:34',
      },
      'id': '89e83c9cf95eb2ab26f02601a84cf42e6a05ab4b5a075b8f2ea43e3e0d2d7d2f',
    },
  ],
  'execution': [
    {
      'command': 'action.devices.commands.OpenClose',
      'params': {
        'followUpToken': '1234567890',
        'openPercent': 0,
      },
    },
  ],
};

const query: SmartHomeV1QueryRequestDevices[] = [
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
];

/* ----------------- */

const setValue = async function (value: string | number | boolean): Promise<CharacteristicType> {
  // Perform your operations here
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

const refreshCharacteristics = async function (): Promise<ServiceType> {
  return hapServiceHue;
};

const setCharacteristic = async function (value: string | number | boolean): Promise<ServiceType> {
  // Perform your operations here
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
  return hapServiceHue;
};

const getCharacteristic = function (): CharacteristicType {
  // Perform your operations here
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

const hapServiceHue: ServiceType = {
  aid: 58,
  iid: 8,
  uuid: '00000043-0000-1000-8000-0026BB765291',
  type: 'Lightbulb',
  humanType: 'Lightbulb',
  serviceName: 'Powder Shower',
  serviceCharacteristics: [
    {
      aid: 58,
      iid: 10,
      uuid: '00000025-0000-1000-8000-0026BB765291',
      type: 'On',
      serviceType: 'Lightbulb',
      serviceName: 'Powder Shower',
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
      aid: 58,
      iid: 11,
      uuid: '000000E3-0000-1000-8000-0026BB765291',
      type: 'ConfiguredName',
      serviceType: 'Lightbulb',
      serviceName: 'Powder Shower',
      description: 'Configured Name',
      value: 'Powder Shower',
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
      aid: 58,
      iid: 12,
      uuid: '00000008-0000-1000-8000-0026BB765291',
      type: 'Brightness',
      serviceType: 'Lightbulb',
      serviceName: 'Powder Shower',
      description: 'Brightness',
      value: 65,
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
      aid: 58,
      iid: 13,
      uuid: '00000013-0000-1000-8000-0026BB765291',
      type: 'Hue',
      serviceType: 'Lightbulb',
      serviceName: 'Powder Shower',
      description: 'Hue',
      value: 0,
      format: 'float',
      perms: ['ev', 'pr', 'pw'],
      unit: 'arcdegrees',
      maxValue: 360,
      minValue: 0,
      minStep: 1,
      canRead: true,
      canWrite: true,
      ev: true,
      setValue,
      getValue,
    },
    {
      aid: 58,
      iid: 14,
      uuid: '0000002F-0000-1000-8000-0026BB765291',
      type: 'Saturation',
      serviceType: 'Lightbulb',
      serviceName: 'Powder Shower',
      description: 'Saturation',
      value: 0,
      format: 'float',
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
      aid: 58,
      iid: 15,
      uuid: '000000CE-0000-1000-8000-0026BB765291',
      type: 'ColorTemperature',
      serviceType: 'Lightbulb',
      serviceName: 'Powder Shower',
      description: 'Color Temperature',
      value: 325,
      format: 'int',
      perms: ['ev', 'pr', 'pw'],
      unit: undefined,
      maxValue: 500,
      minValue: 140,
      minStep: 1,
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
    'Name': 'Powder Shower',
    'Serial Number': 'ED8243-jessie',
    'Firmware Revision': '9.5.0tasmota',
  },
  values: {
    On: 0,
    ConfiguredName: 'Powder Shower',
    Brightness: 65,
    Hue: 0,
    Saturation: 0,
    ColorTemperature: 325,
  },
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
  uniqueId: '2a1f1a87419c2afbd847828b96095f892975c36572751ab71f53edf0c5372fdb',
  refreshCharacteristics,
  setCharacteristic,
  getCharacteristic,
};

const hapServiceOnOff: ServiceType = {
  aid: 13,
  iid: 8,
  uuid: '00000043-0000-1000-8000-0026BB765291',
  type: 'Lightbulb',
  humanType: 'Lightbulb',
  serviceName: 'Shed Light',
  serviceCharacteristics: [
    {
      aid: 13,
      iid: 10,
      uuid: '00000025-0000-1000-8000-0026BB765291',
      type: 'On',
      serviceType: 'Lightbulb',
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
      serviceType: 'Lightbulb',
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

const hapServiceDimmer: ServiceType = {
  aid: 14,
  iid: 8,
  uuid: '00000043-0000-1000-8000-0026BB765291',
  type: 'Lightbulb',
  humanType: 'Lightbulb',
  serviceName: 'Front Hall',
  serviceCharacteristics: [
    {
      aid: 14,
      iid: 10,
      uuid: '00000025-0000-1000-8000-0026BB765291',
      type: 'On',
      serviceType: 'Lightbulb',
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
      serviceType: 'Lightbulb',
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
      serviceType: 'Lightbulb',
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

const commandOpen = {
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
      'command': 'action.devices.commands.OpenClose',
      'params': {
        'followUpToken': '1234567890',
        'openPercent': 100,
      },
    },
  ],
};

const commandClose = {
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
      'command': 'action.devices.commands.OpenClose',
      'params': {
        'followUpToken': '1234567890',
        'openPercent': 0,
      },
    },
  ],
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
