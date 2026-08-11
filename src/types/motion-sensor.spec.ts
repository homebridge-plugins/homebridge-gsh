import { ServiceType } from '@homebridge/hap-client';
import { describe, expect, it } from 'vitest';
import { MotionSensor } from './motion-sensor';
const motionSensor = new MotionSensor();

describe('motionSensor', () => {
  describe('sync message', () => {
    it('motionSensor ', async () => {
      const response: any = motionSensor.sync(motionSensorTemp);
      expect(response).toBeDefined();
      expect(response.type).toBe('action.devices.types.SENSOR');
      expect(response.traits).toContain('action.devices.traits.OccupancySensing');
      expect(response.traits).not.toContain('action.devices.traits.Brightness');
      expect(response.traits).not.toContain('action.devices.traits.ColorSetting');
      expect(response.attributes).toBeDefined();
      expect(response.attributes.occupancySensorConfiguration).toBeDefined();
      expect(response.attributes.occupancySensorConfiguration[0].occupancySensorType).toBe('PHYSICAL_CONTACT');
      // await sleep(10000)
    });
  });
  describe('query message', () => {
    it('motionSensor ', async () => {
      const response = motionSensor.query(motionSensorTemp);
      expect(response).toBeDefined();
      expect(response.occupancy).toBeDefined();
      expect(response.occupancy).toMatch(/^(OCCUPIED|UNOCCUPIED)$/);
      expect(response.online).toBeDefined();
      // await sleep(10000)
    });
  });

  describe('execute message', () => {
    it('motionSensor ', async () => {
      const response = await motionSensor.execute(motionSensorTemp, commandOnOff);
      expect(response).toBeDefined();
      expect(response.ids).toBeDefined();
      expect(response.status).toBe('ERROR');
      // await sleep(10000)
    });

    it('motionSensor  - commandMalformed', async () => {
      const response = await motionSensor.execute(motionSensorTemp, commandMalformed);
      expect(response).toBeDefined();
      expect(response.ids).toBeDefined();
      expect(response.status).toBe('ERROR');
    });

    it('motionSensor  - commandIncorrectCommand', async () => {
      const response = await motionSensor.execute(motionSensorTemp, commandIncorrectCommand);
      expect(response).toBeDefined();
      expect(response.ids).toBeDefined();
      expect(response.status).toBe('ERROR');
    });
  });
});

const motionSensorTemp: ServiceType = {
  aid: 23,
  iid: 13,
  uuid: '00000085-0000-1000-8000-0026BB765291',
  type: 'MotionSensor',
  humanType: 'Motion Sensor',
  serviceName: '',
  serviceCharacteristics: [
    {
      aid: 23,
      iid: 15,
      uuid: '00000022-0000-1000-8000-0026BB765291',
      type: 'MotionDetected',
      serviceType: 'MotionSensor',
      serviceName: '',
      description: 'Motion Detected',
      value: 0,
      format: 'bool',
      perms: [
        'ev',
        'pr',
      ],
      canRead: true,
      canWrite: false,
      ev: true,
    },
  ],
  accessoryInformation: {
    'Manufacturer': 'NRCHKB',
    'Model': '1.4.3',
    'Name': 'Backyard',
    'Serial Number': 'Default Serial Number',
    'Firmware Revision': '1.4.3',
    'Hardware Revision': '1.4.3',
    'Software Revision': '1.4.3',
  },
  'values': {
    'MotionDetected': 0,
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
