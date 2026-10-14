import { ServiceType } from '@homebridge/hap-client';
import { describe, expect, it } from 'vitest';
import { Characteristic } from '../hap-types';
import { Doorbell } from './doorbell';
const doorbell = new Doorbell();

describe('doorbell', () => {
  describe('sync message', () => {
    it('doorbell', async () => {
      const response: any = doorbell.sync(doorbellTemp);
      expect(response).toBeDefined();
      expect(response.id).toBe(doorbellTemp.uniqueId);
      expect(response.type).toBe('action.devices.types.DOORBELL');
      expect(response.traits).toEqual(['action.devices.traits.ObjectDetection']);
      expect(response.notificationSupportedByAgent).toBe(true);
      expect(response.willReportState).toBe(true);
      expect(response.name.name).toBe('Front Door');
    });
  });

  describe('query message', () => {
    it('doorbell', async () => {
      const response = doorbell.query(doorbellTemp);
      expect(response).toEqual({ online: true });
    });
  });

  describe('press detection', () => {
    function makeDoorbell(volume: number): any {
      return {
        ...doorbellTemp,
        serviceCharacteristics: [
          ...doorbellTemp.serviceCharacteristics,
          { uuid: Characteristic.Volume, value: volume },
        ],
      };
    }

    it('doorbell - treats every repeated event as a press', () => {
      const doorbell = new Doorbell();
      const service = makeDoorbell(50);
      doorbell.sync(service);
      expect(doorbell.isPress(service)).toBe(true);
      expect(doorbell.isPress(service)).toBe(true);
    });

    it('doorbell - ignores events where another characteristic (e.g. Volume) changed', () => {
      const doorbell = new Doorbell();
      const service = makeDoorbell(50);
      doorbell.sync(service);

      service.serviceCharacteristics[1].value = 60;
      expect(doorbell.isPress(service)).toBe(false);

      // the next event with Volume unchanged is a press
      expect(doorbell.isPress(service)).toBe(true);
    });
  });

  describe('notification', () => {
    it('doorbell', () => {
      const response = doorbell.notification(doorbellTemp, 946684800000);
      expect(response).toEqual({
        [doorbellTemp.uniqueId]: {
          ObjectDetection: {
            objects: { unclassified: 1 },
            priority: 0,
            detectionTimestamp: 946684800000,
          },
        },
      });
    });
  });

  describe('execute message', () => {
    it('doorbell', async () => {
      const response = await doorbell.execute(doorbellTemp, commandOnOff);
      expect(response).toBeDefined();
      expect(response.ids).toEqual([doorbellTemp.uniqueId]);
      expect(response.status).toBe('ERROR');
    });

    it('doorbell - commandMalformed', async () => {
      const response = await doorbell.execute(doorbellTemp, commandMalformed);
      expect(response).toBeDefined();
      expect(response.ids).toBeDefined();
      expect(response.status).toBe('ERROR');
    });

    it('doorbell - commandIncorrectCommand', async () => {
      const response = await doorbell.execute(doorbellTemp, commandIncorrectCommand);
      expect(response).toBeDefined();
      expect(response.ids).toBeDefined();
      expect(response.status).toBe('ERROR');
    });
  });
});

const doorbellTemp: ServiceType = {
  aid: 12,
  iid: 8,
  uuid: '00000121-0000-1000-8000-0026BB765291',
  type: 'Doorbell',
  humanType: 'Doorbell',
  serviceName: 'Front Door',
  serviceCharacteristics: [
    {
      aid: 12,
      iid: 10,
      uuid: '00000073-0000-1000-8000-0026BB765291',
      type: 'ProgrammableSwitchEvent',
      serviceType: 'Doorbell',
      serviceName: 'Front Door',
      description: 'Programmable Switch Event',
      value: null,
      format: 'uint8',
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
    'Manufacturer': 'Homebridge',
    'Model': 'Doorbell',
    'Name': 'Front Door',
    'Serial Number': 'Default Serial Number',
    'Firmware Revision': '1.0.0',
  },
  'values': {
    'ProgrammableSwitchEvent': null,
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
  'uniqueId': '7c1b0b1f5ad1d3c7a0e6f2b3c4d5e6f708192a3b4c5d6e7f8091a2b3c4d5e6f7',
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
