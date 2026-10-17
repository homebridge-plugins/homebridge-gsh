/* 
  This implements the https://developers.home.google.com/cloud-to-cloud/guides/fan specification
  + https://developers.home.google.com/cloud-to-cloud/traits/fanspeed
*/

import { CharacteristicType, ServiceType } from '@homebridge/hap-client';
import type { SmartHomeV1ExecuteRequestCommands, SmartHomeV1ExecuteResponseCommands } from 'actions-on-google';
import { Characteristic } from '../hap-types.js';
import { ghToHap, ghToHap_t } from './ghToHapTypes.js';

// Fans with more discrete steps than this are treated as continuous
const MAX_NAMED_SPEEDS = 10;

// Continuous fans (minStep 1 / missing) are offered these presets alongside percentage control
const DEFAULT_PRESET_COUNT = 3;

interface FanSpeedStep {
  name: string;
  value: number;
  synonyms: string[];
}

function stepNames(index: number, count: number): { name: string; synonyms: string[] } {
  const n = index + 1;
  const numbered = [`speed ${n}`, `level ${n}`];
  if (count === 3) {
    return [
      { name: 'low', synonyms: ['low', 'minimum', ...numbered] },
      { name: 'medium', synonyms: ['medium', 'mid', ...numbered] },
      { name: 'high', synonyms: ['high', 'maximum', ...numbered] },
    ][index];
  }
  if (count === 2) {
    return [
      { name: 'low', synonyms: ['low', 'minimum', ...numbered] },
      { name: 'high', synonyms: ['high', 'maximum', ...numbered] },
    ][index];
  }
  const synonyms = [...numbered, `${n}`];
  if (index === 0) {
    synonyms.push('low', 'minimum');
  }
  if (index === count - 1) {
    synonyms.push('high', 'maximum');
  }
  return { name: `speed_${n}`, synonyms };
}

/**
 * Derive named speeds from RotationSpeed's minStep/minValue/maxValue.
 * - Stepped fans (2–10 steps, e.g. minStep 16.67 for 6 speeds) get one name per step;
 *   3 steps are named low/medium/high, 2 steps low/high, otherwise speed_1 … speed_N.
 * - Continuous fans (minStep 1 / missing) get low/medium/high presets at 33/66/100%.
 * "Off" is not a speed; it is handled by the OnOff trait.
 */
export function getFanSpeedSteps(rotationSpeed?: CharacteristicType): FanSpeedStep[] | undefined {
  if (!rotationSpeed) {
    return undefined;
  }
  const min = rotationSpeed.minValue ?? 0;
  const max = rotationSpeed.maxValue ?? 100;
  const stepCount = rotationSpeed.minStep && rotationSpeed.minStep > 0
    ? Math.round((max - min) / rotationSpeed.minStep)
    : 0;
  const stepped = stepCount >= 2 && stepCount <= MAX_NAMED_SPEEDS;
  if (!stepped && stepCount === 1) {
    return undefined;
  }

  const count = stepped ? stepCount : DEFAULT_PRESET_COUNT;
  const increment = stepped ? rotationSpeed.minStep! : (max - min) / count;
  const steps: FanSpeedStep[] = [];
  for (let i = 1; i <= count; i++) {
    const raw = min + i * increment;
    // Presets on continuous fans are whole percentages (33, 66, 100)
    const value = i === count ? max : stepped ? Math.round(raw * 100) / 100 : Math.floor(raw);
    steps.push({ value, ...stepNames(i - 1, count) });
  }
  return steps;
}

abstract class FanBase extends ghToHap implements ghToHap_t {
  protected abstract readonly onCharacteristic: string;
  protected abstract coerce(on: boolean): boolean | number;

  sync(service: ServiceType) {
    const traits = ['action.devices.traits.OnOff'];
    const attributes: any = {};

    // FanSpeed (percentage) when RotationSpeed is present, plus named speeds
    const rotationSpeed = service.serviceCharacteristics.find(x => x.uuid === Characteristic.RotationSpeed);
    if (rotationSpeed) {
      traits.push('action.devices.traits.FanSpeed');
      attributes.supportsFanSpeedPercent = true;

      const steps = getFanSpeedSteps(rotationSpeed);
      if (steps) {
        attributes.availableFanSpeeds = {
          speeds: steps.map(step => ({
            speed_name: step.name,
            speed_values: [{ speed_synonym: step.synonyms, lang: 'en' }],
          })),
          ordered: true,
        };
      }
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
      const current = Number(rotationSpeed.value) || 0;
      response.currentFanSpeedPercent = current;

      const steps = getFanSpeedSteps(rotationSpeed);
      if (steps) {
        // Report the step closest to the current RotationSpeed
        response.currentFanSpeedSetting = steps.reduce((best, step) =>
          Math.abs(step.value - current) < Math.abs(best.value - current) ? step : best,
        ).name;
      }
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
        const rotationSpeed = service.serviceCharacteristics.find(x => x.uuid === Characteristic.RotationSpeed);

        // Percentage form – matches HomeKit RotationSpeed
        if (params.fanSpeedPercent !== undefined) {
          if (!rotationSpeed) {
            return { ids: [service.uniqueId], status: 'ERROR', debugString: 'RotationSpeed not supported' };
          }
          await rotationSpeed.setValue(params.fanSpeedPercent);
          return { ids: [service.uniqueId], status: 'SUCCESS' };
        }

        // Named speed form – low/medium/high or speed_N, see getFanSpeedSteps
        if (params.fanSpeed) {
          const step = getFanSpeedSteps(rotationSpeed)?.find(x => x.name === params.fanSpeed);
          if (!rotationSpeed || !step) {
            return { ids: [service.uniqueId], status: 'ERROR', debugString: `unsupported fan speed ${params.fanSpeed}` };
          }
          await rotationSpeed.setValue(step.value);
          return { ids: [service.uniqueId], status: 'SUCCESS' };
        }

        return { ids: [service.uniqueId], status: 'ERROR', debugString: 'missing fanSpeed or fanSpeedPercent' };
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
