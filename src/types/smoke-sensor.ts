import { ServiceType } from '@homebridge/hap-client';
import type { SmartHomeV1ExecuteRequestCommands, SmartHomeV1ExecuteResponseCommands } from 'actions-on-google';
import { Characteristic } from '../hap-types.js';
import { ghToHap, ghToHap_t } from './ghToHapTypes.js';

export class SmokeSensor extends ghToHap implements ghToHap_t {
  sync(service: ServiceType) {
    return this.createSyncData(service, {
      type: 'action.devices.types.SMOKE_DETECTOR',
      traits: [
        'action.devices.traits.SensorState',
      ],
      attributes: {
        sensorStatesSupported: [{
          name: 'SmokeLevel',
          descriptiveCapabilities: {
            availableStates: [
              'smoke detected',
              'no smoke detected',
            ],
          },
        }],
      },
    });
  }

  query(service: ServiceType) {
    return {
      online: true,
      currentSensorStateData: [{
        name: 'SmokeLevel',
        currentSensorState: service.serviceCharacteristics.find(x => x.uuid === Characteristic.SmokeDetected)?.value
          ? 'smoke detected'
          : 'no smoke detected',
      }],
    } as any;
  }

  async execute(service: ServiceType, command: SmartHomeV1ExecuteRequestCommands): Promise<SmartHomeV1ExecuteResponseCommands> {
    if (!command.execution.length) {
      return { ids: [service.uniqueId], status: 'ERROR', debugString: 'missing command' };
    }
    return { ids: [service.uniqueId], status: 'ERROR', debugString: `unknown command ${command.execution[0].command}` };
  }
}
