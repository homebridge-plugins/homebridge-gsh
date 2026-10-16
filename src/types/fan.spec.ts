import { CharacteristicType, ServiceType } from '@homebridge/hap-client';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { Fan, Fanv2, getFanSpeedSteps } from './fan';

let fan: Fan | Fanv2;
let fanServiceOnOff: ServiceType;

['fan', 'fanv2'].forEach((type) => {
  describe(type, () => {
    beforeAll(() => {
      fan = type === 'fan' ? new Fan() : new Fanv2();
      fanServiceOnOff = type === 'fan' ? fanV1ServiceOnOff : fanV2ServiceOnOff;
    });

    describe('sync message', () => {
      it(`${type} with On/Off only`, async () => {
        const response: any = fan.sync(fanServiceOnOff);
        expect(response).toBeDefined();
        expect(response.type).toBe('action.devices.types.FAN');
        expect(response.traits).toContain('action.devices.traits.OnOff');
        expect(response.traits).not.toContain('action.devices.traits.Brightness');
        expect(response.traits).not.toContain('action.devices.traits.ColorSetting');
        expect(response.attributes).not.toBeDefined();
        // await sleep(10000)
      });
    });

    describe('query message', () => {
      it(`${type} with On/Off only`, async () => {
        const response = fan.query(fanServiceOnOff);
        expect(response).toBeDefined();
        expect(response.on).toBeDefined();
        expect(response.online).toBeDefined();
        // await sleep(10000)
      });
    });

    describe('execute message', () => {
      it(`${type} with On/Off only`, async () => {
        const response = await fan.execute(fanServiceOnOff, commandOnOff);
        expect(response).toBeDefined();
        expect(response.ids).toBeDefined();
        expect(response.status).toBe('SUCCESS');
        // await sleep(10000)
      });

      it(`${type} with On/Off only - commandMalformed`, async () => {
        const response = await fan.execute(fanServiceOnOff, commandMalformed);
        expect(response).toBeDefined();
        expect(response.ids).toBeDefined();
        expect(response.status).toBe('ERROR');
      });

      it(`${type} with On/Off only - commandIncorrectCommand`, async () => {
        const response = await fan.execute(fanServiceOnOff, commandIncorrectCommand);
        expect(response).toBeDefined();
        expect(response.ids).toBeDefined();
        expect(response.status).toBe('ERROR');
      });

      it(`${type} with On/Off only - Error`, async () => {
        expect.assertions(1);
        fanServiceOnOff.serviceCharacteristics[0].setValue = setValueError;
        await expect(fan.execute(fanServiceOnOff, commandOnOff)).rejects.toThrow('Error setting value');
        // await sleep(10000)
      });
    });
    describe('sync message – with FanSpeed', () => {
      it(`${type} with On/Off + FanSpeed`, () => {
        const service = type === 'fan' ? fanV1ServiceWithSpeed : fanV2ServiceWithSpeed;
        const response: any = fan.sync(service);

        expect(response.traits).toContain('action.devices.traits.OnOff');
        expect(response.traits).toContain('action.devices.traits.FanSpeed');
        expect(response.attributes).toBeDefined();
        expect(response.attributes.supportsFanSpeedPercent).toBe(true);
      });
    });

    describe('query message – with FanSpeed', () => {
      it(`${type} with On/Off + FanSpeed`, () => {
        const service = type === 'fan' ? fanV1ServiceWithSpeed : fanV2ServiceWithSpeed;
        const response = fan.query(service);

        expect(response.on).toBeDefined();
        expect(response.online).toBe(true);
        expect(response.currentFanSpeedPercent).toBe(type === 'fan' ? 50 : 75);
      });
    });

    describe('execute message – with FanSpeed', () => {
      it(`${type} SetFanSpeed`, async () => {
        const service = type === 'fan' ? fanV1ServiceWithSpeed : fanV2ServiceWithSpeed;
        const response = await fan.execute(service, commandSetFanSpeed);

        expect(response.status).toBe('SUCCESS');
        expect(response.ids).toBeDefined();
      });
    });

    describe('named fan speeds – stepped RotationSpeed', () => {
      it(`${type} continuous fan exposes low/medium/high presets`, () => {
        const service = type === 'fan' ? fanV1ServiceWithSpeed : fanV2ServiceWithSpeed;
        const response: any = fan.sync(service);
        expect(response.attributes.supportsFanSpeedPercent).toBe(true);
        expect(response.attributes.availableFanSpeeds.speeds.map((s: any) => s.speed_name)).toEqual(['low', 'medium', 'high']);
        expect(fan.query(service).currentFanSpeedSetting).toBe('medium');
      });

      it(`${type} sync exposes one named speed per step`, () => {
        const response: any = fan.sync(steppedService(type, 32));
        expect(response.attributes.supportsFanSpeedPercent).toBe(true);
        const { speeds, ordered } = response.attributes.availableFanSpeeds;
        expect(ordered).toBe(true);
        expect(speeds.map((s: any) => s.speed_name)).toEqual(['speed_1', 'speed_2', 'speed_3', 'speed_4', 'speed_5', 'speed_6']);
        expect(speeds[0].speed_values[0].speed_synonym).toEqual(expect.arrayContaining(['speed 1', 'low']));
        expect(speeds[5].speed_values[0].speed_synonym).toEqual(expect.arrayContaining(['speed 6', 'high']));
      });

      it(`${type} query reports the nearest named speed`, () => {
        const response = fan.query(steppedService(type, 32));
        expect(response.currentFanSpeedPercent).toBe(32);
        expect(response.currentFanSpeedSetting).toBe('speed_2');
      });

      it(`${type} execute sets RotationSpeed for a named speed`, async () => {
        const service = steppedService(type, 0);
        const rotationSpeed = service.serviceCharacteristics.find(x => x.type === 'RotationSpeed')!;
        rotationSpeed.setValue = vi.fn(setValue);

        const response = await fan.execute(service, commandSetFanSpeedNamed('speed_2'));
        expect(response.status).toBe('SUCCESS');
        expect(rotationSpeed.setValue).toHaveBeenCalledWith(33.33);

        await fan.execute(service, commandSetFanSpeedNamed('speed_6'));
        expect(rotationSpeed.setValue).toHaveBeenLastCalledWith(100);
      });

      it(`${type} execute rejects an unknown named speed`, async () => {
        const response = await fan.execute(steppedService(type, 0), commandSetFanSpeedNamed('speed_9'));
        expect(response.status).toBe('ERROR');
      });

      it(`${type} execute sets a preset on a continuous fan`, async () => {
        const service = steppedService(type, 0, 1);
        const rotationSpeed = service.serviceCharacteristics.find(x => x.type === 'RotationSpeed')!;
        rotationSpeed.setValue = vi.fn(setValue);

        expect((await fan.execute(service, commandSetFanSpeedNamed('low'))).status).toBe('SUCCESS');
        expect(rotationSpeed.setValue).toHaveBeenLastCalledWith(33);
        await fan.execute(service, commandSetFanSpeedNamed('medium'));
        expect(rotationSpeed.setValue).toHaveBeenLastCalledWith(66);
        await fan.execute(service, commandSetFanSpeedNamed('high'));
        expect(rotationSpeed.setValue).toHaveBeenLastCalledWith(100);
      });
    });
  });
});

describe('getFanSpeedSteps', () => {
  const char = (minStep?: number, maxValue = 100, minValue = 0) =>
    ({ ...fanV1ServiceWithSpeed.serviceCharacteristics[2], minStep, maxValue, minValue });

  it('returns undefined without RotationSpeed or with a single step', () => {
    expect(getFanSpeedSteps(undefined)).toBeUndefined();
    expect(getFanSpeedSteps(char(100))).toBeUndefined();
  });

  it('offers low/medium/high presets for continuous fans', () => {
    for (const steps of [getFanSpeedSteps(char(1)), getFanSpeedSteps(char(undefined))]) {
      expect(steps?.map(s => s.name)).toEqual(['low', 'medium', 'high']);
      expect(steps?.map(s => s.value)).toEqual([33, 66, 100]);
    }
  });

  it('names 3-step and 2-step fans low/medium/high and low/high', () => {
    expect(getFanSpeedSteps(char(100 / 3))?.map(s => [s.name, s.value])).toEqual([['low', 33.33], ['medium', 66.67], ['high', 100]]);
    expect(getFanSpeedSteps(char(1, 3))?.map(s => s.name)).toEqual(['low', 'medium', 'high']);
    expect(getFanSpeedSteps(char(50))?.map(s => s.name)).toEqual(['low', 'high']);
  });

  it('numbers fans with more steps', () => {
    const steps = getFanSpeedSteps(char(25));
    expect(steps?.map(s => s.name)).toEqual(['speed_1', 'speed_2', 'speed_3', 'speed_4']);
    expect(steps?.map(s => s.value)).toEqual([25, 50, 75, 100]);
  });
});

>>>>>>> 2958aa7 (Release 4.2.0 (#111))

const setValue = async function (value: string | number | boolean): Promise<CharacteristicType> {
  // Perform your operations here
  const result: CharacteristicType = {
    aid: 1,
    iid: 1,
    uuid: '00000025-0000-1000-8000-0026BB765291',
    type: 'On',
    serviceType: 'Fan',
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
    serviceType: 'Fan',
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
  return fanServiceHue;
};

const setCharacteristic = async function (value: string | number | boolean): Promise<ServiceType> {
  // Perform your operations here
  const result: CharacteristicType = {
    aid: 1,
    iid: 1,
    uuid: '00000025-0000-1000-8000-0026BB765291',
    type: 'On',
    serviceType: 'Fan',
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
  return fanServiceHue;
};

const getCharacteristic = function (): CharacteristicType {
  // Perform your operations here
  const result: CharacteristicType = {
    aid: 1,
    iid: 1,
    uuid: '00000025-0000-1000-8000-0026BB765291',
    type: 'On',
    serviceType: 'Fan',
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

const fanServiceHue: ServiceType = {
  aid: 58,
  iid: 8,
  uuid: '00000043-0000-1000-8000-0026BB765291',
  type: 'Fan',
  humanType: 'Fan',
  serviceName: 'Powder Shower',
  serviceCharacteristics: [
    {
      aid: 58,
      iid: 10,
      uuid: '00000025-0000-1000-8000-0026BB765291',
      type: 'On',
      serviceType: 'Fan',
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
      serviceType: 'Fan',
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
      serviceType: 'Fan',
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
      serviceType: 'Fan',
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
      serviceType: 'Fan',
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
      serviceType: 'Fan',
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

const fanV1ServiceOnOff: ServiceType = {
  aid: 13,
  iid: 8,
  uuid: '00000043-0000-1000-8000-0026BB765291',
  type: 'Fan',
  humanType: 'Fan',
  serviceName: 'Shed Light',
  serviceCharacteristics: [
    {
      aid: 13,
      iid: 10,
      uuid: '00000025-0000-1000-8000-0026BB765291',
      type: 'On',
      serviceType: 'Fan',
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
      serviceType: 'Fan',
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

const fanV2ServiceOnOff: ServiceType = {
  aid: 13,
  iid: 8,
  uuid: '00000043-0000-1000-8000-0026BB765291',
  type: 'Fan',
  humanType: 'Fan',
  serviceName: 'Shed Light',
  serviceCharacteristics: [
    {
      aid: 13,
      iid: 10,
      uuid: '000000B0-0000-1000-8000-0026BB765291',
      type: 'Active',
      serviceType: 'Fan',
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
      serviceType: 'Fan',
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

// ---------------------------------------------------------------------------
// Fixtures for FanSpeed (RotationSpeed)
// ---------------------------------------------------------------------------

const fanV1ServiceWithSpeed: ServiceType = {
  ...fanV1ServiceOnOff,
  serviceCharacteristics: [
    ...fanV1ServiceOnOff.serviceCharacteristics,
    {
      aid: 13,
      iid: 12,
      uuid: '00000029-0000-1000-8000-0026BB765291', // Characteristic.RotationSpeed
      type: 'RotationSpeed',
      serviceType: 'Fan',
      serviceName: 'Shed Light',
      description: 'Rotation Speed',
      value: 50,
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
  ],
  values: { ...fanV1ServiceOnOff.values, RotationSpeed: 50 },
};

const fanV2ServiceWithSpeed: ServiceType = {
  ...fanV2ServiceOnOff,
  serviceCharacteristics: [
    ...fanV2ServiceOnOff.serviceCharacteristics,
    {
      aid: 13,
      iid: 12,
      uuid: '00000029-0000-1000-8000-0026BB765291',
      type: 'RotationSpeed',
      serviceType: 'Fan',
      serviceName: 'Shed Light',
      description: 'Rotation Speed',
      value: 75,
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
  ],
  values: { ...fanV2ServiceOnOff.values, RotationSpeed: 75 },
};



// 6-speed fan (e.g. homebridge-tuya), RotationSpeed minStep = 100 / 6
function steppedService(type: string, value: number, minStep = 100 / 6): ServiceType {
  const base = type === 'fan' ? fanV1ServiceWithSpeed : fanV2ServiceWithSpeed;
  return {
    ...base,
    serviceCharacteristics: base.serviceCharacteristics.map(x =>
      x.type === 'RotationSpeed' ? { ...x, value, minStep } : x,
    ),
  };
}

const fanServiceDimmer: ServiceType = {
  aid: 14,
  iid: 8,
  uuid: '00000043-0000-1000-8000-0026BB765291',
  type: 'Fan',
  humanType: 'Fan',
  serviceName: 'Front Hall',
  serviceCharacteristics: [
    {
      aid: 14,
      iid: 10,
      uuid: '00000025-0000-1000-8000-0026BB765291',
      type: 'On',
      serviceType: 'Fan',
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
      serviceType: 'Fan',
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
      serviceType: 'Fan',
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

const commandSetFanSpeed = {
  devices: commandOnOff.devices,
  execution: [
    {
      command: 'action.devices.commands.SetFanSpeed',
      params: { fanSpeedPercent: 40 },
    },
  ],
};

const commandSetFanSpeedNamed = (fanSpeed: string) => ({
  devices: commandOnOff.devices,
  execution: [
    {
      command: 'action.devices.commands.SetFanSpeed',
      params: { fanSpeed },
    },
  ],
});

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
