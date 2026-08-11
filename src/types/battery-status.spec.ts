import { ServiceType } from '@homebridge/hap-client';
import { describe, expect, it } from 'vitest';
import { Battery } from './battery-status';

const battery = new Battery();

describe('battery', () => {
  describe('sync message', () => {
    it('battery ', async () => {
      const response: any = battery.sync(batteryTemp);
      expect(response).toBeDefined();
      expect(response.type).toBe('action.devices.types.SENSOR');
      expect(response.traits).toContain('action.devices.traits.EnergyStorage');
      expect(response.traits).not.toContain('action.devices.traits.Brightness');
      expect(response.traits).not.toContain('action.devices.traits.ColorSetting');
      expect(response.attributes).toBeDefined();
      expect(response.attributes.queryOnlyEnergyStorage).toBe(true);
      // await sleep(10000)
    });
  });
  describe('query message', () => {
    it('battery ', async () => {
      const response = battery.query(batteryTemp);
      expect(response).toBeDefined();
      expect(response.descriptiveCapacityRemaining).toBeDefined();
      expect(response.capacityRemaining).toBeDefined();
      expect(response.online).toBeDefined();
      // await sleep(10000)
    });
  });

  describe('execute message', () => {
    it('battery ', async () => {
      const response = await battery.execute(batteryTemp, commandOnOff);
      expect(response).toBeDefined();
      expect(response.ids).toBeDefined();
      expect(response.status).toBe('ERROR');
      // await sleep(10000)
    });

    it('battery  - commandMalformed', async () => {
      const response = await battery.execute(batteryTemp, commandMalformed);
      expect(response).toBeDefined();
      expect(response.ids).toBeDefined();
      expect(response.status).toBe('ERROR');
    });

    it('battery  - commandIncorrectCommand', async () => {
      const response = await battery.execute(batteryTemp, commandIncorrectCommand);
      expect(response).toBeDefined();
      expect(response.ids).toBeDefined();
      expect(response.status).toBe('ERROR');
    });
  });
});

const batteryTemp: ServiceType = {
  'aid': 23,
  'iid': 23,
  'uuid': '00000096-0000-1000-8000-0026BB765291',
  'type': 'Battery',
  'humanType': 'Battery',
  'serviceName': '',
  'serviceCharacteristics': [
    {
      'aid': 23,
      'iid': 25,
      'uuid': '00000079-0000-1000-8000-0026BB765291',
      'type': 'StatusLowBattery',
      'serviceType': 'Battery',
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
      'iid': 26,
      'uuid': '0000008F-0000-1000-8000-0026BB765291',
      'type': 'ChargingState',
      'serviceType': 'Battery',
      'serviceName': '',
      'description': 'Charging State',
      'value': 2,
      'format': 'uint8',
      'perms': [
        'ev',
        'pr',
      ],
      'maxValue': 2,
      'minValue': 0,
      'minStep': 1,
      'canRead': true,
      'canWrite': false,
      'ev': true,
    },
    {
      'aid': 23,
      'iid': 27,
      'uuid': '00000068-0000-1000-8000-0026BB765291',
      'type': 'BatteryLevel',
      'serviceType': 'Battery',
      'serviceName': '',
      'description': 'Battery Level',
      'value': 100,
      'format': 'uint8',
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
    'StatusLowBattery': 1,
    'ChargingState': 2,
    'BatteryLevel': 10,
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