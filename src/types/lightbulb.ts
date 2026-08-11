/* eslint-disable max-len */

import { ServiceType } from '@homebridge/hap-client';
import type { SmartHomeV1ExecuteRequestCommands, SmartHomeV1ExecuteResponseCommands, SmartHomeV1SyncDevices } from 'actions-on-google';
import { Characteristic } from '../hap-types.js';
import { ghToHap, ghToHap_t } from './ghToHapTypes.js';

export class Lightbulb extends ghToHap implements ghToHap_t {
  sync(service: ServiceType): SmartHomeV1SyncDevices {
    const attributes = {} as any;
    const traits = [
      'action.devices.traits.OnOff',
    ];

    // check if the bulb has the brightness characteristic
    if (service.serviceCharacteristics.find(x => x.uuid === Characteristic.Brightness)) {
      traits.push('action.devices.traits.Brightness');
    }

    // check if the bulb has color
    if (service.serviceCharacteristics.find(x => x.uuid === Characteristic.Hue)) {
      traits.push('action.devices.traits.ColorSetting');
      attributes.colorModel = 'hsv';
    }

    if (service.serviceCharacteristics.find(x => x.uuid === Characteristic.ColorTemperature)) {
      traits.push('action.devices.traits.ColorSetting');
      attributes.colorTemperatureRange = {
        temperatureMinK: 2000,
        temperatureMaxK: 6000,
      };
      attributes.commandOnlyColorSetting = false;
    }

    return this.createSyncData(service, {
      type: 'action.devices.types.LIGHT',
      traits,
      attributes,
    });
  }

  query(service: ServiceType) {
    const response = {
      on: !!service.serviceCharacteristics.find(x => x.uuid === Characteristic.On).value,
      online: true,
    } as any;

    // check if the bulb has the brightness characteristic
    if (service.serviceCharacteristics.find(x => x.uuid === Characteristic.Brightness)) {
      response.brightness = service.serviceCharacteristics.find(x => x.uuid === Characteristic.Brightness).value;
    }

    // check if the bulb has color
    if (service.serviceCharacteristics.find(x => x.uuid === Characteristic.Hue)) {
      response.color = {
        spectrumHsv: {
          hue: service.serviceCharacteristics.find(x => x.uuid === Characteristic.Hue).value,
          saturation: Number(service.serviceCharacteristics.find(x => x.uuid === Characteristic.Saturation).value) / 100,
          value: 1,
        },
      };
    }

    // check if the bulb has cct
    if (service.serviceCharacteristics.find(x => x.uuid === Characteristic.ColorTemperature)) {
      const min = service.serviceCharacteristics.find(x => x.uuid === Characteristic.ColorTemperature).minValue;
      const max = service.serviceCharacteristics.find(x => x.uuid === Characteristic.ColorTemperature).maxValue;
      const value = (Number(max) - Number(min)) - (Number(service.serviceCharacteristics.find(x => x.uuid === Characteristic.ColorTemperature).value) - Number(min)) + Number(min);
      response.color = {
        temperatureK: 2000 + (6000 - 2000) * ((value - min) / (max - min)),
      };
    }

    return response;
  }

  async execute(service: ServiceType, command: SmartHomeV1ExecuteRequestCommands): Promise<SmartHomeV1ExecuteResponseCommands> {
    if (!command.execution.length) {
      return { ids: [service.uniqueId], status: 'ERROR', debugString: 'missing command' };
    }
    switch (command.execution[0].command) {
      case ('action.devices.commands.OnOff'): {
        await service.serviceCharacteristics.find(x => x.uuid === Characteristic.On).setValue(command.execution[0].params.on);
        return { ids: [service.uniqueId], status: 'SUCCESS' };
      }
      case ('action.devices.commands.BrightnessAbsolute'): {
        await service.serviceCharacteristics.find(x => x.uuid === Characteristic.On).setValue(command.execution[0].params.on);
        await service.serviceCharacteristics.find(x => x.uuid === Characteristic.Brightness).setValue(command.execution[0].params.brightness);
        return { ids: [service.uniqueId], status: 'SUCCESS' };
      }
      case ('action.devices.commands.ColorAbsolute'): {
        if (command.execution[0].params.color.spectrumHSV) {
          await service.serviceCharacteristics.find(x => x.uuid === Characteristic.Hue).setValue(command.execution[0].params.color.spectrumHSV.hue);
          await service.serviceCharacteristics.find(x => x.uuid === Characteristic.Saturation).setValue(command.execution[0].params.color.spectrumHSV.saturation * 100);
          return { ids: [service.uniqueId], status: 'SUCCESS' };
        }
        if (command.execution[0].params.color.temperature) {
          const min = service.serviceCharacteristics.find(x => x.uuid === Characteristic.ColorTemperature).minValue;
          const max = service.serviceCharacteristics.find(x => x.uuid === Characteristic.ColorTemperature).maxValue;
          const value = command.execution[0].params.color.temperature;
          const hbAccessoryValue = min + (max - min) * ((value - 2000) / (6000 - 2000));
          await service.serviceCharacteristics.find(x => x.uuid === Characteristic.ColorTemperature).setValue((max - min) - (hbAccessoryValue - min) + min);
          return { ids: [service.uniqueId], status: 'SUCCESS' };
        }
        break;
      }
      default: { return { ids: [service.uniqueId], status: 'ERROR', debugString: `unknown command ${command.execution[0].command}` }; }
    }
  }
}
