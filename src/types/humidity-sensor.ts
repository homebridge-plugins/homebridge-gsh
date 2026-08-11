import { ServiceType } from '@homebridge/hap-client';
import type { SmartHomeV1ExecuteRequestCommands, SmartHomeV1ExecuteResponseCommands, SmartHomeV1SyncDevices } from 'actions-on-google';
import { Characteristic } from '../hap-types.js';
import { ghToHap, ghToHap_t } from './ghToHapTypes.js';

export class HumiditySensor extends ghToHap implements ghToHap_t {
  sync(service: ServiceType): SmartHomeV1SyncDevices {

    return this.createSyncData(service, {
      type: 'action.devices.types.SENSOR',
      traits: ['action.devices.traits.HumiditySetting'],
      attributes: {
        queryOnlyHumiditySetting: true,
      },
    });
  }

  query(service: ServiceType) {
    return {
      online: true,
      humidityAmbientPercent: service.serviceCharacteristics.find(x => x.uuid === Characteristic.CurrentRelativeHumidity)?.value,
    } as any;
  }

  async execute(service: ServiceType, command: SmartHomeV1ExecuteRequestCommands): Promise<SmartHomeV1ExecuteResponseCommands> {
    if (!command.execution.length) {
      return { ids: [service.uniqueId], status: 'ERROR', debugString: 'missing command' };
    }
    return { ids: [service.uniqueId], status: 'ERROR', debugString: `unknown command ${command.execution[0].command}` };
  }
}
