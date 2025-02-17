import { CharacteristicType, ServiceType } from '@homebridge/hap-client';
import { Hap } from '../hap';
import { PluginConfig } from '../interfaces';

import { Log } from '../logger';

import { HeaterCooler } from './heater-cooler';

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

const hap = new Hap(socketMock, log, '031-45-154', config);

const heaterCooler = new HeaterCooler(hap);

describe('heaterCooler', () => {
  describe('sync message', () => {
    it('heaterCooler heat and cool', async () => {
      const response: any = heaterCooler.sync(heaterCoolerTemp);
      expect(response).toBeDefined();
      expect(response.type).toBe('action.devices.types.THERMOSTAT');
      expect(response.traits).toContain('action.devices.traits.TemperatureSetting');
      expect(response.traits).toContain('action.devices.traits.OnOff');
      expect(response.traits).not.toContain('action.devices.traits.FanSpeed');
      expect(response.traits).not.toContain('action.devices.traits.Brightness');
      expect(response.traits).not.toContain('action.devices.traits.ColorSetting');
      expect(response.attributes).toBeDefined();
      expect(response.attributes.commandOnlyOnOff).toBe(false);
      expect(response.attributes.queryOnlyOnOff).toBe(false);
      expect(response.attributes.supportsFanSpeedPercent).toBeUndefined();
      expect(response.attributes.availableThermostatModes).toBeDefined();
      expect(response.attributes.availableThermostatModes).toContain('off');
      expect(response.attributes.availableThermostatModes).toContain('heat');
      expect(response.attributes.availableThermostatModes).toContain('cool');
      expect(response.attributes.availableThermostatModes).toContain('heatcool');
      expect(response.attributes.availableThermostatModes).not.toContain('auto');
      expect(response.attributes.thermostatTemperatureUnit).toBeDefined();
      // await sleep(10000)
    });

    it('heaterCooler cool only', async () => {
      const response: any = heaterCooler.sync(heaterCoolerNoHeat);
      expect(response).toBeDefined();
      expect(response.type).toBe('action.devices.types.THERMOSTAT');
      expect(response.traits).toContain('action.devices.traits.TemperatureSetting');
      expect(response.traits).toContain('action.devices.traits.OnOff');
      expect(response.traits).not.toContain('action.devices.traits.FanSpeed');
      expect(response.traits).not.toContain('action.devices.traits.Brightness');
      expect(response.traits).not.toContain('action.devices.traits.ColorSetting');
      expect(response.attributes).toBeDefined();
      expect(response.attributes.commandOnlyOnOff).toBe(false);
      expect(response.attributes.queryOnlyOnOff).toBe(false);
      expect(response.attributes.supportsFanSpeedPercent).toBeUndefined();
      expect(response.attributes.availableThermostatModes).toBeDefined();
      expect(response.attributes.availableThermostatModes).toContain('off');
      expect(response.attributes.availableThermostatModes).toContain('heat');
      expect(response.attributes.availableThermostatModes).toContain('cool');
      expect(response.attributes.availableThermostatModes).not.toContain('heatcool');
      expect(response.attributes.availableThermostatModes).toContain('auto');
      expect(response.attributes.thermostatTemperatureUnit).toBeDefined();
      // await sleep(10000)
    });
    it('heaterCooler ac as thermostat', async () => {
      const response: any = heaterCooler.sync(heaterCoolerAC);
      expect(response).toBeDefined();
      expect(response.type).not.toBe('action.devices.types.AC_UNIT');
      expect(response.type).toBe('action.devices.types.THERMOSTAT');
      expect(response.traits).toContain('action.devices.traits.TemperatureSetting');
      expect(response.traits).toContain('action.devices.traits.OnOff');
      expect(response.traits).toContain('action.devices.traits.FanSpeed');
      expect(response.traits).not.toContain('action.devices.traits.Brightness');
      expect(response.traits).not.toContain('action.devices.traits.ColorSetting');
      expect(response.attributes).toBeDefined();
      expect(response.attributes.commandOnlyOnOff).toBe(false);
      expect(response.attributes.queryOnlyOnOff).toBe(false);
      expect(response.attributes.supportsFanSpeedPercent).toBe(true);
      expect(response.attributes.availableThermostatModes).toBeDefined();
      expect(response.attributes.availableThermostatModes).toContain('off');
      expect(response.attributes.availableThermostatModes).toContain('heat');
      expect(response.attributes.availableThermostatModes).toContain('cool');
      expect(response.attributes.availableThermostatModes).toContain('heatcool');
      expect(response.attributes.availableThermostatModes).not.toContain('auto');
      expect(response.attributes.thermostatTemperatureUnit).toBeDefined();
      // await sleep(10000)
    });
    it('heaterCooler ac as ac_unit', async () => {
      const hap = new Hap(socketMock, log, '031-45-154', { ...config, showHeaterCoolerAsACUnit: true });
      const heaterCooler = new HeaterCooler(hap);
      const response: any = heaterCooler.sync(heaterCoolerAC);
      expect(response).toBeDefined();
      expect(response.type).toBe('action.devices.types.AC_UNIT');
      expect(response.type).not.toBe('action.devices.types.THERMOSTAT');
      expect(response.traits).toContain('action.devices.traits.TemperatureSetting');
      expect(response.traits).toContain('action.devices.traits.OnOff');
      expect(response.traits).toContain('action.devices.traits.FanSpeed');
      expect(response.traits).not.toContain('action.devices.traits.Brightness');
      expect(response.traits).not.toContain('action.devices.traits.ColorSetting');
      expect(response.attributes).toBeDefined();
      expect(response.attributes.commandOnlyOnOff).toBe(false);
      expect(response.attributes.queryOnlyOnOff).toBe(false);
      expect(response.attributes.supportsFanSpeedPercent).toBe(true);
      expect(response.attributes.availableThermostatModes).toBeDefined();
      expect(response.attributes.availableThermostatModes).toContain('off');
      expect(response.attributes.availableThermostatModes).toContain('heat');
      expect(response.attributes.availableThermostatModes).toContain('cool');
      expect(response.attributes.availableThermostatModes).toContain('heatcool');
      expect(response.attributes.availableThermostatModes).not.toContain('auto');
      expect(response.attributes.thermostatTemperatureUnit).toBeDefined();
    });
  });

  describe('query message', () => {
    it('heaterCooler heat and cool', async () => {
      const response = heaterCooler.query(heaterCoolerTemp);
      expect(response).toBeDefined();
      expect(response.online).toBeDefined();
      expect(response.on).toBeDefined();
      expect(response.thermostatMode).toBeDefined();
      expect(response.thermostatTemperatureAmbient).toBeDefined();
      expect(response.thermostatTemperatureSetpoint).toBeDefined();
      expect(response.currentFanSpeedPercent).toBeUndefined();
      // await sleep(10000)
    });

    it('heaterCooler cool only', async () => {
      const response = heaterCooler.query(heaterCoolerNoHeat);
      expect(response).toBeDefined();
      expect(response.online).toBeDefined();
      expect(response.on).toBeDefined();
      expect(response.thermostatMode).toBeDefined();
      expect(response.thermostatTemperatureAmbient).toBeDefined();
      expect(response.currentFanSpeedPercent).toBeUndefined();
      // await sleep(10000)
    });

    it('heaterCooler ac', async () => {
      const response = heaterCooler.query(heaterCoolerAC);
      expect(response).toBeDefined();
      expect(response.online).toBeDefined();
      expect(response.on).toBeDefined();
      expect(response.thermostatMode).toBeDefined();
      expect(response.thermostatTemperatureAmbient).toBeDefined();
      expect(response.currentFanSpeedPercent).toBeDefined();
      // await sleep(10000)
    });
  });

  describe('execute message', () => {
    it('heaterCooler - setMode', async () => {
      const response = await heaterCooler.execute(heaterCoolerTemp, commandThermostatSetModeOff);
      expect(response).toBeDefined();
      expect(response.ids).toBeDefined();
      expect(response.status).toBe('SUCCESS');
      // await sleep(10000)
    });

    it('heaterCooler - setTemp', async () => {
      const response = await heaterCooler.execute(heaterCoolerTemp, commandThermostatTemperatureSetpoint);
      expect(response).toBeDefined();
      expect(response.ids).toBeDefined();
      expect(response.status).toBe('SUCCESS');
      // await sleep(10000)
    });

    it('heaterCooler - setRange', async () => {
      const response = await heaterCooler.execute(heaterCoolerTemp, commandThermostatTemperatureSetRange);
      expect(response).toBeDefined();
      expect(response.ids).toBeDefined();
      expect(response.status).toBe('SUCCESS');
      // await sleep(10000)
    });

    it('heaterCooler - setOnOff', async () => {
      const response = await heaterCooler.execute(heaterCoolerTemp, commandThermostatOff);
      expect(response).toBeDefined();
      expect(response.ids).toBeDefined();
      expect(response.status).toBe('SUCCESS');
      // await sleep(10000)
    });

    it('heaterCooler - setFanSpeed', async () => {
      const response = await heaterCooler.execute(heaterCoolerAC, commandThermostatSetFanSpeed);
      expect(response).toBeDefined();
      expect(response.ids).toBeDefined();
      expect(response.status).toBe('SUCCESS');
      // await sleep(10000)
    });

    it('heaterCooler - setFanSpeed fails', async () => {
      const response = await heaterCooler.execute(heaterCoolerTemp, commandThermostatSetFanSpeed);
      expect(response).toBeDefined();
      expect(response.ids).toBeDefined();
      expect(response.status).toBe('ERROR');
      // await sleep(10000)
    });

    it('heaterCooler  - commandMalformed', async () => {
      const response = await heaterCooler.execute(heaterCoolerTemp, commandMalformed);
      expect(response).toBeDefined();
      expect(response.ids).toBeDefined();
      expect(response.status).toBe('ERROR');
    });

    it('heaterCooler  - commandIncorrectCommand', async () => {
      const response = await heaterCooler.execute(heaterCoolerTemp, commandIncorrectCommand);
      expect(response).toBeDefined();
      expect(response.ids).toBeDefined();
      expect(response.status).toBe('ERROR');
    });

    it('heaterCooler  - Error', async () => {
      expect.assertions(1);
      heaterCoolerTemp.serviceCharacteristics[0].setValue = setValueError;
      // const response = heaterCooler.execute(heaterCoolerTemp, commandThermostatSetModeOff);
      expect(heaterCooler.execute(heaterCoolerTemp, commandThermostatSetModeOff)).rejects.toThrow('Error setting value');
      // await sleep(10000)
    });
  });
  afterAll(async () => {
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
    serviceType: 'HeaterCooler',
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
    serviceType: 'HeaterCooler',
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
  return heaterCoolerTemp;
};

const setCharacteristic = async function (value: string | number | boolean): Promise<ServiceType> {
  // Perform your operations here
  const result: CharacteristicType = {
    aid: 1,
    iid: 1,
    uuid: '00000025-0000-1000-8000-0026BB765291',
    type: 'On',
    serviceType: 'HeaterCooler',
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
  return heaterCoolerTemp;
};

const getCharacteristic = function (): CharacteristicType {
  // Perform your operations here
  const result: CharacteristicType = {
    aid: 1,
    iid: 1,
    uuid: '00000025-0000-1000-8000-0026BB765291',
    type: 'On',
    serviceType: 'HeaterCooler',
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

const heaterCoolerTemp: ServiceType = {
  aid: 13,
  iid: 8,
  uuid: '00000043-0000-1000-8000-0026BB765291',
  type: 'HeaterCooler',
  humanType: 'HeaterCooler',
  serviceName: 'Shed Light',
  serviceCharacteristics: [
    {
      aid: 13,
      iid: 11,
      uuid: '000000B0-0000-1000-8000-0026BB765291',
      type: 'ConfiguredName',
      serviceType: 'Active',
      serviceName: 'Shed Light',
      description: 'Configured Name',
      value: 1,
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
      aid: 13,
      iid: 10,
      uuid: '00000011-0000-1000-8000-0026BB765291',
      type: 'On',
      serviceType: 'CurrentTemperature',
      serviceName: 'Shed Light',
      description: 'On',
      value: 25,
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
      uuid: '00000012-0000-1000-8000-0026BB765291',
      type: 'ConfiguredName',
      serviceType: 'HeatingThresholdTemperature',
      serviceName: 'Shed Light',
      description: 'Configured Name',
      value: 19,
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
      aid: 13,
      iid: 11,
      uuid: '00000036-0000-1000-8000-0026BB765291',
      type: 'ConfiguredName',
      serviceType: 'TemperatureDisplayUnits',
      serviceName: 'Shed Light',
      description: 'Configured Name',
      value: 1,
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
      aid: 13,
      iid: 11,
      uuid: '000000B2-0000-1000-8000-0026BB765291',
      type: 'ConfiguredName',
      serviceType: 'TargetHeaterCoolerState',
      serviceName: 'Shed Light',
      description: 'Configured Name',
      value: 1,
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
      aid: 13,
      iid: 11,
      uuid: '0000000D-0000-1000-8000-0026BB765291',
      type: 'ConfiguredName',
      serviceType: 'CoolingThresholdTemperature',
      serviceName: 'Shed Light',
      description: 'Configured Name',
      value: 1,
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

const heaterCoolerNoHeat: ServiceType = {
  aid: 13,
  iid: 8,
  uuid: '00000043-0000-1000-8000-0026BB765291',
  type: 'HeaterCooler',
  humanType: 'HeaterCooler',
  serviceName: 'Shed Light',
  serviceCharacteristics: [
    {
      aid: 13,
      iid: 10,
      uuid: '00000011-0000-1000-8000-0026BB765291',
      type: 'On',
      serviceType: 'CurrentTemperature',
      serviceName: 'Shed Light',
      description: 'On',
      value: 25,
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
      uuid: '00000036-0000-1000-8000-0026BB765291',
      type: 'ConfiguredName',
      serviceType: 'TemperatureDisplayUnits',
      serviceName: 'Shed Light',
      description: 'Configured Name',
      value: 1,
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
      aid: 13,
      iid: 11,
      uuid: '000000B2-0000-1000-8000-0026BB765291',
      type: 'ConfiguredName',
      serviceType: 'TargetHeaterCoolerState',
      serviceName: 'Shed Light',
      description: 'Configured Name',
      value: 2,
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
      aid: 13,
      iid: 11,
      uuid: '0000000D-0000-1000-8000-0026BB765291',
      type: 'ConfiguredName',
      serviceType: 'CoolingThresholdTemperature',
      serviceName: 'Shed Light',
      description: 'Configured Name',
      value: 1,
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
      aid: 13,
      iid: 11,
      uuid: '000000B0-0000-1000-8000-0026BB765291',
      type: 'ConfiguredName',
      serviceType: 'Active',
      serviceName: 'Shed Light',
      description: 'Configured Name',
      value: 1,
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

const heaterCoolerAC: ServiceType = {
  aid: 13,
  iid: 8,
  uuid: '00000043-0000-1000-8000-0026BB765291',
  type: 'HeaterCooler',
  humanType: 'HeaterCooler',
  serviceName: 'Shed Light',
  serviceCharacteristics: [
    {
      aid: 13,
      iid: 11,
      uuid: '000000B0-0000-1000-8000-0026BB765291',
      type: 'ConfiguredName',
      serviceType: 'Active',
      serviceName: 'Shed Light',
      description: 'Configured Name',
      value: 1,
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
      aid: 13,
      iid: 10,
      uuid: '00000011-0000-1000-8000-0026BB765291',
      type: 'On',
      serviceType: 'CurrentTemperature',
      serviceName: 'Shed Light',
      description: 'On',
      value: 25,
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
      uuid: '00000012-0000-1000-8000-0026BB765291',
      type: 'ConfiguredName',
      serviceType: 'HeatingThresholdTemperature',
      serviceName: 'Shed Light',
      description: 'Configured Name',
      value: 19,
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
      aid: 13,
      iid: 11,
      uuid: '00000036-0000-1000-8000-0026BB765291',
      type: 'ConfiguredName',
      serviceType: 'TemperatureDisplayUnits',
      serviceName: 'Shed Light',
      description: 'Configured Name',
      value: 1,
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
      aid: 13,
      iid: 11,
      uuid: '000000B2-0000-1000-8000-0026BB765291',
      type: 'ConfiguredName',
      serviceType: 'TargetHeaterCoolerState',
      serviceName: 'Shed Light',
      description: 'Configured Name',
      value: 1,
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
      aid: 13,
      iid: 11,
      uuid: '0000000D-0000-1000-8000-0026BB765291',
      type: 'ConfiguredName',
      serviceType: 'RotationSpeed',
      serviceName: 'Shed Light',
      description: 'Configured Name',
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
      aid: 13,
      iid: 11,
      uuid: '00000029-0000-1000-8000-0026BB765291',
      type: 'ConfiguredName',
      serviceType: 'CoolingThresholdTemperature',
      serviceName: 'Shed Light',
      description: 'Configured Name',
      value: 1,
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

const commandThermostatSetModeOff = {
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
      command: 'action.devices.commands.ThermostatSetMode',
      params: {
        thermostatMode: 'off',
      },
    },
  ],
};

const commandThermostatTemperatureSetpoint = {
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
      command: 'action.devices.commands.ThermostatSetMode',
      params: {
        thermostatMode: 'off',
      },
    },
  ],
};

const commandThermostatTemperatureSetRange = {
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
      command: 'action.devices.commands.ThermostatSetMode',
      params: {
        thermostatMode: 'off',
      },
    },
  ],
};

const commandThermostatOff = {
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
        on: false,
      },
    },
  ],
};

const commandThermostatSetFanSpeed = {
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
      command: 'action.devices.commands.SetFanSpeed',
      params: {
        fanSpeedPercent: 50,
      },
    },
  ],
};
