import { ServiceType } from '@homebridge/hap-client';
import { describe, expect, it } from 'vitest';
import { CarbonMonoxideSensor } from './carbon-monoxide-sensor';

const carbonMonoxideSensor = new CarbonMonoxideSensor();

describe('carbonMonoxideSensor', () => {
  describe('sync message', () => {
    it('carbonMonoxideSensor', async () => {
      const response: any = carbonMonoxideSensor.sync(carbonMonoxideSensorTemp);
      expect(response).toBeDefined();
      expect(response.type).toBe('action.devices.types.CARBON_MONOXIDE_DETECTOR');
      expect(response.traits).toContain('action.devices.traits.SensorState');
      expect(response.attributes.sensorStatesSupported).toEqual([{
        name: 'CarbonMonoxideLevel',
        descriptiveCapabilities: {
          availableStates: [
            'carbon monoxide detected',
            'no carbon monoxide detected',
          ],
        },
      }]);
    });
  });

  describe('query message', () => {
    it('carbonMonoxideSensor', async () => {
      const response = carbonMonoxideSensor.query(carbonMonoxideSensorTemp);
      expect(response).toBeDefined();
      expect(response.online).toBe(true);
      expect(response.currentSensorStateData).toEqual([{
        name: 'CarbonMonoxideLevel',
        currentSensorState: 'no carbon monoxide detected',
      }]);
      carbonMonoxideSensorTemp.serviceCharacteristics[0].value = 1;
      expect(carbonMonoxideSensor.query(carbonMonoxideSensorTemp).currentSensorStateData).toEqual([{
        name: 'CarbonMonoxideLevel',
        currentSensorState: 'carbon monoxide detected',
      }]);
      carbonMonoxideSensorTemp.serviceCharacteristics[0].value = 0;
    });
  });

  describe('execute message', () => {
    it('carbonMonoxideSensor', async () => {
      const response = await carbonMonoxideSensor.execute(carbonMonoxideSensorTemp, commandOnOff);
      expect(response).toBeDefined();
      expect(response.ids).toBeDefined();
      expect(response.status).toBe('ERROR');
    });

    it('carbonMonoxideSensor - commandMalformed', async () => {
      const response = await carbonMonoxideSensor.execute(carbonMonoxideSensorTemp, commandMalformed);
      expect(response).toBeDefined();
      expect(response.ids).toBeDefined();
      expect(response.status).toBe('ERROR');
    });
  });
});

const carbonMonoxideSensorTemp: ServiceType = {
  aid: 23,
  iid: 13,
  uuid: '0000007F-0000-1000-8000-0026BB765291',
  type: 'CarbonMonoxideSensor',
  humanType: 'Carbon Monoxide Sensor',
  serviceName: '',
  serviceCharacteristics: [
    {
      aid: 23,
      iid: 13,
      uuid: '00000069-0000-1000-8000-0026BB765291',
      type: 'CarbonMonoxideDetected',
      serviceType: 'CarbonMonoxideSensor',
      serviceName: '',
      description: 'Carbon Monoxide Detected',
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
    Manufacturer: 'NRCHKB',
    Model: '1.4.3',
    Name: 'Backyard',
    'Serial Number': 'Default Serial Number',
    'Firmware Revision': '1.4.3',
    'Hardware Revision': '1.4.3',
    'Software Revision': '1.4.3',
  },
  values: {
    CarbonMonoxideDetected: 0,
  },
  instance: {
    name: 'Default Model',
    username: '69:62:B7:AE:38:D4',
    ipAddress: '192.168.1.11',
    port: 51830,
    connectionFailedCount: 0,
    services: [],
    configurationNumber: 1,
  },
  uniqueId: '4a1df9989d8d4e7b440455f15d9bdd5326d81f80ccfa753499899864a5248657',
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
  execution: [],
};
