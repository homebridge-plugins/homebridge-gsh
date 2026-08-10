import { CharacteristicType, ServiceType } from '@homebridge/hap-client';
import { Hap } from '../hap';
import { PluginConfig } from '../interfaces';
import { Sensor } from './sensors';

import { Log } from '../logger';


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
    // eslint-disable-next-line no-console
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
  combineSensors: true,
};

const pluginMock = new class {
  log: Log;
  constructor() {
    this.log = new Log(console, true);
  }
};

const hap = new Hap(socketMock, pluginMock, '031-45-154', config, {});

describe('combine sensors', () => {
  describe('sync message', () => {
    it('sensors combine', async () => {
      hap.services = [	// initialize once
        batteryTemp,
        temperatureSensorTemp,
        humiditySensorTemp,
        motionSensorTemp,
        switchTemp,
        contactSensorTemp,
        windowCoveringTemp,
        contactSensorTemp1,
        contactSensorTemp2,
      ];
      let response: any;
      
      response = hap.types[batteryTemp.type].sync(batteryTemp);
      expect(response).not.toBeDefined();
      
      response = hap.types[humiditySensorTemp.type].sync(humiditySensorTemp);
      expect(response).not.toBeDefined();
      
      response = hap.types[temperatureSensorTemp.type].sync(temperatureSensorTemp);
      expect(response).toBeDefined();
      expect(response.id).toBe(temperatureSensorTemp.uniqueId);
      expect(response.type).toBe('action.devices.types.SENSOR');
      expect(response.traits).toContain('action.devices.traits.TemperatureControl');
      expect(response.traits).toContain('action.devices.traits.HumiditySetting');
      expect(response.traits).toContain('action.devices.traits.EnergyStorage');
      expect(response.traits).not.toContain('action.devices.traits.Brightness');
      expect(response.traits).not.toContain('action.devices.traits.ColorSetting');
      expect(response.attributes).toBeDefined();
      expect(response.attributes.queryOnlyTemperatureControl).toBe(true);
      expect(response.attributes.temperatureUnitForUX).toBe('C');
      expect(response.attributes.queryOnlyHumiditySetting).toBe(true);
      expect(response.attributes.queryOnlyEnergyStorage).toBe(true);
    });
  });
  describe('query message', () => {
    it('sensors combine', async () => {
      let response: any;
      
      response = hap.types[batteryTemp.type].query(batteryTemp);
      expect(response).toBeDefined();
      expect(response.id).toBe(temperatureSensorTemp.uniqueId);
      expect(response.temperatureSetpointCelsius).toBeDefined();
      expect(response.temperatureAmbientCelsius).toBeDefined();
      expect(response.humidityAmbientPercent).toBeDefined();
      expect(response.descriptiveCapacityRemaining).toBeDefined();
      expect(response.capacityRemaining).toBeDefined();
      expect(response.online).toBeDefined();
      
      response = hap.types[temperatureSensorTemp.type].query(temperatureSensorTemp);
      expect(response).toBeDefined();
      expect(response.id).not.toBeDefined();
      expect(response.temperatureSetpointCelsius).toBeDefined();
      expect(response.temperatureAmbientCelsius).toBeDefined();
      expect(response.humidityAmbientPercent).toBeDefined();
      expect(response.descriptiveCapacityRemaining).toBeDefined();
      expect(response.capacityRemaining).toBeDefined();
      expect(response.online).toBeDefined();
    });
  });
  describe('execute message', () => {
    it('sensors ', async () => {
      const response = await hap.types[batteryTemp.type].execute(batteryTemp, commandOnOff);
      expect(response).toBeDefined();
      expect(response.ids).toBeDefined();
      expect(response.status).toBe('ERROR');
    });
  });

  describe('sync message', () => {
    it('sensors with switch', async () => {
      let response: any;
      
      response = hap.types[switchTemp.type].sync(switchTemp);
      expect(response).toBeDefined();
      expect(response.id).toBe(switchTemp.uniqueId);
      expect(response.type).toBe('action.devices.types.SWITCH');
      expect(response.traits).toContain('action.devices.traits.OnOff');
      expect(response.traits).not.toContain('action.devices.traits.OccupancySensing');

      response = hap.types[motionSensorTemp.type].sync(motionSensorTemp);
      expect(response).toBeDefined();
      expect(response.id).toBe(switchTemp.uniqueId);
      expect(response.type).toBe('action.devices.types.SWITCH');
      expect(response.traits).toContain('action.devices.traits.OnOff');
      expect(response.traits).toContain('action.devices.traits.OccupancySensing');
      expect(response.attributes).toBeDefined();
      expect(response.attributes.occupancySensorConfiguration).toBeDefined();
      expect(response.attributes.occupancySensorConfiguration[0].occupancySensorType).toBe('PHYSICAL_CONTACT');

      response = hap.types[switchTemp.type].sync(switchTemp);
      expect(response).toBeDefined();
      expect(response.id).toBe(switchTemp.uniqueId);
      expect(response.type).toBe('action.devices.types.SWITCH');
      expect(response.traits).toContain('action.devices.traits.OnOff');
      expect(response.traits).toContain('action.devices.traits.OccupancySensing');
      expect(response.attributes).toBeDefined();
      expect(response.attributes.occupancySensorConfiguration).toBeDefined();
      expect(response.attributes.occupancySensorConfiguration[0].occupancySensorType).toBe('PHYSICAL_CONTACT');
    });
  });
  describe('query message', () => {
    it('sensors with switch', async () => {
      let response: any;
      
      response = hap.types[motionSensorTemp.type].query(motionSensorTemp);
      expect(response).toBeDefined();
      expect(response.id).toBe(switchTemp.uniqueId);
      expect(response.on).toBeDefined();
      expect(response.occupancy).toBeDefined();
      expect(response.occupancy).toMatch(/^(OCCUPIED|UNOCCUPIED)$/);
      expect(response.online).toBeDefined();

      response = hap.types[switchTemp.type].query(switchTemp);
      expect(response).toBeDefined();
      expect(response.id).not.toBeDefined();
      expect(response.on).toBeDefined();
      expect(response.occupancy).toBeDefined();
      expect(response.occupancy).toMatch(/^(OCCUPIED|UNOCCUPIED)$/);
      expect(response.online).toBeDefined();
    });
  });

  describe('sync message', () => {
    it('sensors conflicting traits', async () => {
      let response: any;
      
      response = hap.types[contactSensorTemp.type].sync(contactSensorTemp);
      expect(response).toBeDefined();
      expect(response.id).toBe(contactSensorTemp.uniqueId);
      expect(response.type).toBe('action.devices.types.SENSOR');
      expect(response.traits).toContain('action.devices.traits.OpenClose');

      response = hap.types[windowCoveringTemp.type].sync(windowCoveringTemp);
      expect(response).toBeDefined();
      expect(response.id).toBe(windowCoveringTemp.uniqueId);
      expect(response.type).toBe('action.devices.types.WINDOW');
      expect(response.traits).toContain('action.devices.traits.OpenClose');
    });
  });
  describe('query message', () => {
    it('sensors conflicting traits', async () => {
      let response: any;
      
      response = hap.types[contactSensorTemp.type].query(contactSensorTemp);
      expect(response).toBeDefined();
      expect(response.id).not.toBeDefined();
      expect(response.openPercent).toBeDefined();
      expect(response.on).not.toBeDefined();
      expect(response.online).toBeDefined();

      response = hap.types[windowCoveringTemp.type].query(windowCoveringTemp);
      expect(response).toBeDefined();
      expect(response.id).not.toBeDefined();
      expect(response.openPercent).toBeDefined();
      expect(response.on).toBeDefined();
      expect(response.online).toBeDefined();
    });
  });

  describe('sync message', () => {
    it('sensors multiple instances', async () => {
      let response: any;

      response = hap.types[contactSensorTemp1.type].sync(contactSensorTemp1);
      expect(response).toBeDefined();
      expect(response.id).toBe(contactSensorTemp1.uniqueId);
      expect(response.type).toBe('action.devices.types.SENSOR');
      expect(response.traits).toContain('action.devices.traits.OpenClose');

      response = hap.types[contactSensorTemp2.type].sync(contactSensorTemp2);
      expect(response).toBeDefined();
      expect(response.id).toBe(contactSensorTemp2.uniqueId);
      expect(response.type).toBe('action.devices.types.SENSOR');
      expect(response.traits).toContain('action.devices.traits.OpenClose');
    });
  });
  describe('query message', () => {
    it('sensors multiple instances', async () => {
      let response: any;

      response = hap.types[contactSensorTemp1.type].query(contactSensorTemp1);
      expect(response).toBeDefined();
      expect(response.id).not.toBeDefined();
      expect(response.openPercent).toBeDefined();
      expect(response.on).not.toBeDefined();
      expect(response.online).toBeDefined();

      response = hap.types[contactSensorTemp2.type].query(contactSensorTemp2);
      expect(response).toBeDefined();
      expect(response.id).not.toBeDefined();
      expect(response.openPercent).toBeDefined();
      expect(response.on).not.toBeDefined();
      expect(response.online).toBeDefined();
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
  'uniqueId': '4a1df9989d8d4e7b440455f15d9bdd5326d81f80ccfa753499899864a5248658',
};

const motionSensorTemp: ServiceType = {
  aid: 33,
  iid: 13,
  uuid: '00000085-0000-1000-8000-0026BB765291',
  type: 'MotionSensor',
  humanType: 'Motion Sensor',
  serviceName: '',
  serviceCharacteristics: [
    {
      aid: 33,
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
  'uniqueId': '4a1df9989d8d4e7b440455f15d9bdd5326d81f80ccfa753499899864a5248659',
};

const switchTemp: ServiceType = {
  aid: 33,
  iid: 8,
  uuid: '00000043-0000-1000-8000-0026BB765291',
  type: 'Switch',
  humanType: 'Switch',
  serviceName: 'Shed Light',
  serviceCharacteristics: [
    {
      aid: 33,
      iid: 10,
      uuid: '00000025-0000-1000-8000-0026BB765291',
      type: 'On',
      serviceType: 'Switch',
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
    },
  ],
  'accessoryInformation': {
    'Manufacturer': 'Tasmota',
    'Model': 'WiOn',
    'Name': 'Shed Light',
    'Serial Number': '02231D-jessie',
    'Firmware Revision': '9.5.0tasmota',
  },
  'values': {
    'On': 0,
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
  uniqueId: '664195d5556f1e0b424ed32bcd863ec8954c76f8ab81cc399f0e24f8827806d1',
};

const contactSensorTemp: ServiceType = {
  'aid': 43,
  'iid': 13,
  'uuid': '00000086-0000-1000-8000-0026BB765291',
  'type': 'ContactSensor',
  'humanType': 'Contact Sensor',
  'serviceName': 'Contact Sensor',
  'serviceCharacteristics': [
    {
      aid: 43,
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
  'uniqueId': '4a1df9989d8d4e7b440455f15d9bdd5326d81f80ccfa753499899864a5248656',
};

const contactSensorTemp1: ServiceType = {
  'aid': 53,
  'iid': 13,
  'uuid': '00000086-0000-1000-8000-0026BB765291',
  'type': 'ContactSensor',
  'humanType': 'Contact Sensor',
  'serviceName': 'Contact Sensor1',
  'serviceCharacteristics': [
    {
      aid: 53,
      iid: 13,
      uuid: '0000006A-0000-1000-8000-0026BB765291',
      type: 'ContactSensorState',
      serviceType: 'ContactSensor',
      serviceName: 'Contact Sensor1',
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

const contactSensorTemp2: ServiceType = {
  'aid': 53,
  'iid': 14,
  'uuid': '00000086-0000-1000-8000-0026BB765291',
  'type': 'ContactSensor',
  'humanType': 'Contact Sensor',
  'serviceName': 'Contact Sensor2',
  'serviceCharacteristics': [
    {
      aid: 53,
      iid: 14,
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
  'uniqueId': '4a1df9989d8d4e7b440455f15d9bdd5326d81f80ccfa753499899864a5248658',
};

const windowCoveringTemp: ServiceType = {
  aid: 43,
  iid: 8,
  uuid: '00000043-0000-1000-8000-0026BB765291',
  type: 'Window',
  humanType: 'Window',
  serviceName: 'Shed Light',
  serviceCharacteristics: [
    {
      aid: 43,
      iid: 10,
      uuid: '000000B0-0000-1000-8000-0026BB765291',
      type: 'Active',
      serviceType: 'Window',
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
    },
    {
      aid: 43,
      iid: 10,
      uuid: '0000007C-0000-1000-8000-0026BB765291',
      type: 'TargetPosition',
      serviceType: 'Window',
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
    },
    {
      aid: 43,
      iid: 10,
      uuid: '0000006D-0000-1000-8000-0026BB765291',
      type: 'CurrentPosition',
      serviceType: 'Window',
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
    On: 0,
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
  uniqueId: '664195d5556f1e0b424ed32bcd863ec8954c76f8ab81cc399f0e24f8827806d2',
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
