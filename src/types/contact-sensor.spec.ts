import { ServiceType } from '@homebridge/hap-client';
import { describe, expect, it } from 'vitest';
import { ContactSensor } from './contact-sensor';

const contactSensor = new ContactSensor();

describe('contactSensor', () => {
  describe('sync message', () => {
    it('contactSensor ', async () => {
      const response: any = contactSensor.sync(contactSensorTemp);
      expect(response).toBeDefined();
      expect(response.type).toBe('action.devices.types.SENSOR');
      expect(response.traits).toContain('action.devices.traits.OpenClose');
      expect(response.traits).not.toContain('action.devices.traits.Brightness');
      expect(response.traits).not.toContain('action.devices.traits.ColorSetting');
      expect(response.attributes).toBeDefined();
      expect(response.attributes.discreteOnlyOpenClose).toBe(true);
      expect(response.attributes.openDirection).toBeDefined();
      expect(response.attributes.queryOnlyOpenClose).toBe(true);
      // await sleep(10000)
    });
  });
  describe('query message', () => {
    it('contactSensor ', async () => {
      const response = contactSensor.query(contactSensorTemp);
      expect(response).toBeDefined();
      expect(response.openPercent).toBeDefined();
      expect(response.openPercent).toBe(0);
      // expect(response.openPercent).toBe(100);
      expect(response.online).toBeDefined();
      // await sleep(10000)
    });
  });

  describe('execute message', () => {
    it('contactSensor ', async () => {
      const response = await contactSensor.execute(contactSensorTemp, commandOnOff);
      expect(response).toBeDefined();
      expect(response.ids).toBeDefined();
      expect(response.status).toBe('ERROR');
      // await sleep(10000)
    });

    it('contactSensor  - commandMalformed', async () => {
      const response = await contactSensor.execute(contactSensorTemp, commandMalformed);
      expect(response).toBeDefined();
      expect(response.ids).toBeDefined();
      expect(response.status).toBe('ERROR');
    });

    it('contactSensor  - commandIncorrectCommand', async () => {
      const response = await contactSensor.execute(contactSensorTemp, commandIncorrectCommand);
      expect(response).toBeDefined();
      expect(response.ids).toBeDefined();
      expect(response.status).toBe('ERROR');
    });
  });
});

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

const contactSensorTemp: ServiceType = {
  'aid': 23,
  'iid': 13,
  'uuid': '00000086-0000-1000-8000-0026BB765291',
  'type': 'ContactSensor',
  'humanType': 'Contact Sensor',
  'serviceName': '',
  'serviceCharacteristics': [
    {
      aid: 23,
      iid: 13,
      uuid: '0000006A-0000-1000-8000-0026BB765291',
      type: 'ContactSensorState',
      serviceType: 'ContactSensor',
      serviceName: '',
      description: 'Contact Sensor State',
      value: 0,
      format: 'uint8',
      perms: [
        'ev',
        'pr',
      ],
      maxValue: 1,
      minValue: 0,
      minStep: 1,
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
  values: {
    ContactSensorState: 0,
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
