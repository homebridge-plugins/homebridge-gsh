/* 
  This implements the https://developers.home.google.com/cloud-to-cloud/guides/fan specification
  + https://developers.home.google.com/cloud-to-cloud/traits/fanspeed
*/

import { ServiceType } from '@homebridge/hap-client';
import type { SmartHomeV1ExecuteRequestCommands, SmartHomeV1ExecuteResponseCommands } from 'actions-on-google';
import { Characteristic } from '../hap-types.js';
import { ghToHap, ghToHap_t } from './ghToHapTypes.js';

abstract class FanBase extends ghToHap implements ghToHap_t {
  protected abstract readonly onCharacteristic: string;
  protected abstract coerce(on: boolean): boolean | number;

  sync(service: ServiceType) {
    const traits = ['action.devices.traits.OnOff'];
    const attributes: any = {};

    // FanSpeed (percentage) when RotationSpeed is present
    if (service.serviceCharacteristics.find(x => x.uuid === Characteristic.RotationSpeed)) {
      traits.push('action.devices.traits.FanSpeed');
      attributes.supportsFanSpeedPercent = true;
    }

    // Optional: reverse direction support
    if (service.serviceCharacteristics.find(x => x.uuid === Characteristic.RotationDirection)) {
      attributes.reversible = true;
    }

    const syncData: any = {
      type: 'action.devices.types.FAN',
      traits,
    };

    // Only include attributes when we have something to report
    if (Object.keys(attributes).length > 0) {
      syncData.attributes = attributes;
    }

    return this.createSyncData(service, syncData);
  }

  query(service: ServiceType) {
    const response: any = {
      on: !!service.serviceCharacteristics.find(x => x.uuid === this.onCharacteristic)?.value,
      online: true,
    };

    const rotationSpeed = service.serviceCharacteristics.find(x => x.uuid === Characteristic.RotationSpeed);
    if (rotationSpeed) {
      response.currentFanSpeedPercent = Number(rotationSpeed.value) || 0;
    }

    return response;
  }

  async execute(service: ServiceType, command: SmartHomeV1ExecuteRequestCommands): Promise<SmartHomeV1ExecuteResponseCommands> {
    if (!command.execution.length) {
      return { ids: [service.uniqueId], status: 'ERROR', debugString: 'missing command' };
    }

    switch (command.execution[0].command) {
      case 'action.devices.commands.OnOff': {
        await service.serviceCharacteristics
          .find(x => x.uuid === this.onCharacteristic)
          ?.setValue(this.coerce(command.execution[0].params.on));
        return { ids: [service.uniqueId], status: 'SUCCESS' };
      }

      case 'action.devices.commands.SetFanSpeed': {
        const params = command.execution[0].params;

        // Percentage form (preferred – matches HomeKit RotationSpeed)
        if (params.fanSpeedPercent !== undefined) {
          const rotationSpeed = service.serviceCharacteristics.find(x => x.uuid === Characteristic.RotationSpeed);
          if (!rotationSpeed) {
            return { ids: [service.uniqueId], status: 'ERROR', debugString: 'RotationSpeed not supported' };
          }
          await rotationSpeed.setValue(params.fanSpeedPercent);
          return { ids: [service.uniqueId], status: 'SUCCESS' };
        }

        // Named speed form (not used with supportsFanSpeedPercent, but kept for completeness)
        if (params.fanSpeed) {
          return { ids: [service.uniqueId], status: 'ERROR', debugString: 'named fan speeds not supported' };
        }

        return { ids: [service.uniqueId], status: 'ERROR', debugString: 'missing fanSpeedPercent' };
      }

      case 'action.devices.commands.Reverse': {
        const directionChar = service.serviceCharacteristics.find(x => x.uuid === Characteristic.RotationDirection);
        if (!directionChar) {
          return { ids: [service.uniqueId], status: 'ERROR', debugString: 'RotationDirection not supported' };
        }
        // Toggle 0 ↔ 1 (HomeKit: 0 = clockwise, 1 = counterclockwise)
        const current = Number(directionChar.value) || 0;
        await directionChar.setValue(current === 0 ? 1 : 0);
        return { ids: [service.uniqueId], status: 'SUCCESS' };
      }

      default: {
        return {
          ids: [service.uniqueId],
          status: 'ERROR',
          debugString: `unknown command ${command.execution[0].command}`,
        };
      }
    }
  }
}

export class Fan extends FanBase {
  protected readonly onCharacteristic = Characteristic.On;
  protected coerce(on: boolean) {
    return on;
  }
}

export class Fanv2 extends FanBase {
  protected readonly onCharacteristic = Characteristic.Active;
  protected coerce(on: boolean) {
    return on ? 1 : 0;
  }
}