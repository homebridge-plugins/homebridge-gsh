import { ServiceType } from '@homebridge/hap-client';
import type { SmartHomeV1ExecuteRequestCommands, SmartHomeV1ExecuteResponseCommands, SmartHomeV1SyncDevices } from 'actions-on-google';
import { Characteristic } from '../hap-types.js';
import { ghToHap, ghToHap_t } from './ghToHapTypes.js';

export class Battery extends ghToHap implements ghToHap_t {
  sync(service: ServiceType): SmartHomeV1SyncDevices {

    return this.createSyncData(service, {
      type: 'action.devices.types.SENSOR',
      traits: ['action.devices.traits.EnergyStorage'],
      attributes: {
        queryOnlyEnergyStorage: true,
      },
    });
  }

  query(service: ServiceType) {
    const response = {
      online: true,
    } as any;

    // check if the sensor has the StatusLowBattery characteristic
    const lowBattery = service.serviceCharacteristics.find(x => x.uuid === Characteristic.StatusLowBattery)?.value as number;
    if (lowBattery !== undefined) {
      response['descriptiveCapacityRemaining'] = lowBattery ? 'CRITICALLY_LOW' : 'MEDIUM';
    }

    // check if the sensor has the batteryLevel characteristic
    if (service.serviceCharacteristics.find(x => x.uuid === Characteristic.BatteryLevel)) {
      const descriptions = ['CRITICALLY_LOW', 'CRITICALLY_LOW', 'LOW', 'MEDIUM', 'HIGH', 'FULL', 'FULL'];
      const thresholds = [0, 10, 20, 40, 80, 90, 100];
      const current = service.serviceCharacteristics.find(x => x.uuid === Characteristic.BatteryLevel)?.value as number;
      const description = lowBattery ? descriptions[0] : descriptions[
        thresholds.reduce((x, y, i) => {
          return current >= y ? i : x;
        }, 0)
      ];
      response['descriptiveCapacityRemaining'] = description;
      response['capacityRemaining'] = [{
        rawValue: current,
        unit: 'PERCENTAGE',
      }];
    }

    return response;
  }

  async execute(service: ServiceType, command: SmartHomeV1ExecuteRequestCommands): Promise<SmartHomeV1ExecuteResponseCommands> {
    if (!command.execution.length) {
      return { ids: [service.uniqueId], status: 'ERROR', debugString: 'missing command' };
    }
    return { ids: [service.uniqueId], status: 'ERROR', debugString: `unknown command ${command.execution[0].command}` };
  }
}
