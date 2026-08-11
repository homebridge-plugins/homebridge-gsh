/* eslint-disable max-len */

import { ServiceType } from '@homebridge/hap-client';
import type { SmartHomeV1ExecuteRequestCommands, SmartHomeV1ExecuteResponseCommands } from 'actions-on-google';
import { Characteristic } from '../hap-types.js';
import { Hap } from '../hap.js';
import { ghToHap, ghToHap_t } from './ghToHapTypes.js';

export class Thermostat extends ghToHap implements ghToHap_t {
  constructor(
    private hap: Hap,
  ) {
    super();
  }

  sync(service: ServiceType) {
    const availableThermostatModes = ['off', 'heat', 'cool'];

    if (service.serviceCharacteristics.find(x => x.uuid === Characteristic.CoolingThresholdTemperature)
      && service.serviceCharacteristics.find(x => x.uuid === Characteristic.HeatingThresholdTemperature)) {
      availableThermostatModes.push('heatcool');
    } else {
      availableThermostatModes.push('auto');
    }

    return this.createSyncData(service, {
      type: 'action.devices.types.THERMOSTAT',
      traits: [
        'action.devices.traits.TemperatureSetting',
      ],
      attributes: {
        availableThermostatModes: availableThermostatModes.join(','),
        thermostatTemperatureUnit: this.hap.config.forceFahrenheit
          ? 'F'
          : service.serviceCharacteristics.find(x => x.uuid === Characteristic.TemperatureDisplayUnits).value ? 'F' : 'C',
      },
    });
  }

  query(service: ServiceType) {
    const currentHeatingCoolingState: number = Number(service.serviceCharacteristics.find(x => x.uuid === Characteristic.CurrentHeatingCoolingState).value);
    const activeThermostatMode = ['off', 'heat', 'cool'][currentHeatingCoolingState];
    const targetHeatingCoolingState: number = Number(service.serviceCharacteristics.find(x => x.uuid === Characteristic.TargetHeatingCoolingState).value);
    const thermostatMode = ['off', 'heat', 'cool', 'auto'][targetHeatingCoolingState];

    const response = {
      online: true,
      activeThermostatMode,
      thermostatMode,
      thermostatTemperatureSetpoint: service.serviceCharacteristics.find(x => x.uuid === Characteristic.TargetTemperature).value,
      thermostatTemperatureAmbient: service.serviceCharacteristics.find(x => x.uuid === Characteristic.CurrentTemperature).value,
    } as any;

    // check if device reports CurrentRelativeHumidity
    if (service.serviceCharacteristics.find(x => x.uuid === Characteristic.CurrentRelativeHumidity)) {
      response.thermostatHumidityAmbient = service.serviceCharacteristics.find(x => x.uuid === Characteristic.CurrentRelativeHumidity).value;
    }

    // check if device reports CoolingThresholdTemperature and HeatingThresholdTemperature
    if (service.serviceCharacteristics.find(x => x.uuid === Characteristic.CoolingThresholdTemperature)
      && service.serviceCharacteristics.find(x => x.uuid === Characteristic.HeatingThresholdTemperature)) {
      // translate mode
      if (response.thermostatMode === 'auto') {
        response.thermostatMode = 'heatcool';
      }

      response.thermostatTemperatureSetpointLow = service.serviceCharacteristics.find(x => x.uuid === Characteristic.HeatingThresholdTemperature).value;
      response.thermostatTemperatureSetpointHigh = service.serviceCharacteristics.find(x => x.uuid === Characteristic.CoolingThresholdTemperature).value;
    }

    return response;
  }

  async execute(service: ServiceType, command: SmartHomeV1ExecuteRequestCommands): Promise<SmartHomeV1ExecuteResponseCommands> {
    if (!command.execution.length) {
      return { ids: [service.uniqueId], status: 'ERROR', debugString: 'missing command' };
    }

    switch (command.execution[0].command) {
      case ('action.devices.commands.ThermostatSetMode'): {
        const mode = {
          off: 0,
          heat: 1,
          cool: 2,
          auto: 3,
          heatcool: 3,
        };
        await service.serviceCharacteristics.find(x => x.uuid === Characteristic.TargetHeatingCoolingState).setValue(mode[command.execution[0].params.thermostatMode]);
        return { ids: [service.uniqueId], status: 'SUCCESS' };
      }
      case ('action.devices.commands.ThermostatTemperatureSetpoint'): {
        await service.serviceCharacteristics.find(x => x.uuid === Characteristic.TargetTemperature).setValue(command.execution[0].params.thermostatTemperatureSetpoint);
        return { ids: [service.uniqueId], status: 'SUCCESS' };
      }
      case ('action.devices.commands.ThermostatTemperatureSetRange'): {
        await service.serviceCharacteristics.find(x => x.uuid === Characteristic.CoolingThresholdTemperature).setValue(command.execution[0].params.thermostatTemperatureSetpointHigh);
        await service.serviceCharacteristics.find(x => x.uuid === Characteristic.HeatingThresholdTemperature).setValue(command.execution[0].params.thermostatTemperatureSetpointLow);
        return { ids: [service.uniqueId], status: 'SUCCESS' };
      }
      default: { return { ids: [service.uniqueId], status: 'ERROR', debugString: `unknown command ${command.execution[0].command}` }; }
    }
  }
}
