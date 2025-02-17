/* eslint-disable max-len */

import type { SmartHomeV1ExecuteRequestCommands, SmartHomeV1ExecuteResponseCommands } from 'actions-on-google';
import { ServiceType } from '@homebridge/hap-client';
import { Hap } from '../hap';
import { Characteristic } from '../hap-types';
import { ghToHap, ghToHap_t } from './ghToHapTypes';

export class HeaterCooler extends ghToHap implements ghToHap_t {
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

    const traits = [
      'action.devices.traits.TemperatureSetting',
      'action.devices.traits.OnOff',
    ];

    const attributes: any = {
      availableThermostatModes: availableThermostatModes.join(','),
      thermostatTemperatureUnit: this.hap.config.forceFahrenheit
        ? 'F'
        : service.serviceCharacteristics.find(x => x.uuid === Characteristic.TemperatureDisplayUnits)?.value ? 'F' : 'C',
      commandOnlyOnOff: false,
      queryOnlyOnOff: false,
    };

    const type = this.hap.config.showHeaterCoolerAsACUnit ? 'action.devices.types.AC_UNIT' : 'action.devices.types.THERMOSTAT';

    if (service.serviceCharacteristics.find(x => x.uuid === Characteristic.RotationSpeed)) {
      traits.push('action.devices.traits.FanSpeed');
      attributes.supportsFanSpeedPercent = true;
    }

    return this.createSyncData(service, {
      type,
      traits,
      attributes,
    });
  }

  query(service: ServiceType) {
    const targetHeatingCoolingState: number = Number(service.serviceCharacteristics.find(x => x.uuid === Characteristic.TargetHeaterCoolerState).value);
    const activeState = service.serviceCharacteristics.find(x => x.uuid === Characteristic.Active).value;
    const thermostatMode = activeState ? ['auto', 'heat', 'cool'][targetHeatingCoolingState] : 'off';

    const response = {
      online: true,
      on: !!activeState,
      thermostatMode,
      activeThermostatMode: thermostatMode,
      thermostatTemperatureAmbient: service.serviceCharacteristics.find(x => x.uuid === Characteristic.CurrentTemperature).value,
    } as any;

    // check if device reports CoolingThresholdTemperature and HeatingThresholdTemperature
    if (service.serviceCharacteristics.find(x => x.uuid === Characteristic.CoolingThresholdTemperature)
      && service.serviceCharacteristics.find(x => x.uuid === Characteristic.HeatingThresholdTemperature)) {
      if (response.thermostatMode === 'heat') {
        response.thermostatTemperatureSetpoint = service.serviceCharacteristics.find(x => x.uuid === Characteristic.HeatingThresholdTemperature).value;
      } else if (response.thermostatMode === 'cool') {
        response.thermostatTemperatureSetpoint = service.serviceCharacteristics.find(x => x.uuid === Characteristic.CoolingThresholdTemperature).value;
      } else if (response.thermostatMode === 'auto') {
        response.thermostatMode = 'heatcool';
        response.thermostatTemperatureSetpointLow = service.serviceCharacteristics.find(x => x.uuid === Characteristic.HeatingThresholdTemperature).value;
        response.thermostatTemperatureSetpointHigh = service.serviceCharacteristics.find(x => x.uuid === Characteristic.CoolingThresholdTemperature).value;
      }
    }

    if (service.serviceCharacteristics.find(x => x.uuid === Characteristic.RotationSpeed)) {
      response.currentFanSpeedPercent = service.serviceCharacteristics.find(x => x.uuid === Characteristic.RotationSpeed).value;
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
          auto: 0,
          heat: 1,
          cool: 2,
          heatcool: 0,
        };

        if (command.execution[0].params.thermostatMode === 'off') {
          await service.serviceCharacteristics.find(x => x.uuid === Characteristic.Active).setValue(0);
        } else {
          await service.serviceCharacteristics.find(x => x.uuid === Characteristic.Active).setValue(1);

          await service.serviceCharacteristics.find(x => x.uuid === Characteristic.TargetHeaterCoolerState).setValue(mode[command.execution[0].params.thermostatMode]);
        }
        return { ids: [service.uniqueId], status: 'SUCCESS' };
      }
      case ('action.devices.commands.ThermostatTemperatureSetpoint'): {

        await service.serviceCharacteristics.find(x => x.uuid === Characteristic.CoolingThresholdTemperature).setValue(command.execution[0].params.thermostatTemperatureSetpoint);

        await service.serviceCharacteristics.find(x => x.uuid === Characteristic.HeatingThresholdTemperature).setValue(command.execution[0].params.thermostatTemperatureSetpoint);
        return { ids: [service.uniqueId], status: 'SUCCESS' };
      }
      case ('action.devices.commands.ThermostatTemperatureSetRange'): {

        await service.serviceCharacteristics.find(x => x.uuid === Characteristic.CoolingThresholdTemperature).setValue(command.execution[0].params.thermostatTemperatureSetpointHigh);
        await service.serviceCharacteristics.find(x => x.uuid === Characteristic.HeatingThresholdTemperature).setValue(command.execution[0].params.thermostatTemperatureSetpointLow);
        return { ids: [service.uniqueId], status: 'SUCCESS' };
      }
      case ('action.devices.commands.SetFanSpeed'): {

        if (!service.serviceCharacteristics.find(x => x.uuid === Characteristic.RotationSpeed)) {
          return { ids: [service.uniqueId], status: 'ERROR', debugString: 'fan speed not supported' };
        }
        await service.serviceCharacteristics.find(x => x.uuid === Characteristic.RotationSpeed).setValue(command.execution[0].params.fanSpeedPercent);
        return { ids: [service.uniqueId], status: 'SUCCESS' };
      }
      case ('action.devices.commands.OnOff'): {

        await service.serviceCharacteristics.find(x => x.uuid === Characteristic.Active).setValue(command.execution[0].params.on ? 1 : 0);
        return { ids: [service.uniqueId], status: 'SUCCESS' };
      }
      default: { return { ids: [service.uniqueId], status: 'ERROR', debugString: `unknown command ${command.execution[0].command}` }; }
    }
  }
}
