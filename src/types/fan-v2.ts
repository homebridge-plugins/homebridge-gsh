import { ServiceType } from '@homebridge/hap-client';
import type { SmartHomeV1ExecuteRequestCommands, SmartHomeV1ExecuteResponseCommands } from 'actions-on-google';
import { Characteristic } from '../hap-types.js';
import { ghToHap, ghToHap_t } from './ghToHapTypes.js';

export class Fanv2 extends ghToHap implements ghToHap_t {
  sync(service: ServiceType) {
    return this.createSyncData(service, {
      type: 'action.devices.types.FAN',
      traits: [
        'action.devices.traits.OnOff',
      ],
    });
  }


  query(service: ServiceType) {
    return {
      on: !!service.serviceCharacteristics.find(x => x.uuid === Characteristic.Active).value,
      online: true,
    };
  }

  async execute(service: ServiceType, command: SmartHomeV1ExecuteRequestCommands): Promise<SmartHomeV1ExecuteResponseCommands> {
    if (!command.execution.length) {
      return { ids: [service.uniqueId], status: 'ERROR', debugString: 'missing command' };
    }
    switch (command.execution[0].command) {
      case ('action.devices.commands.OnOff'): {
        await service.serviceCharacteristics.find(x => x.uuid === Characteristic.Active).setValue(command.execution[0].params.on ? 1 : 0);
        return { ids: [service.uniqueId], status: 'SUCCESS' };
      }
      default: { return { ids: [service.uniqueId], status: 'ERROR', debugString: `unknown command ${command.execution[0].command}` }; }
    }
  }
}
