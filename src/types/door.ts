import { ServiceType } from '@homebridge/hap-client';
import { SmartHomeV1ExecuteRequestCommands, SmartHomeV1ExecuteResponseCommands } from 'actions-on-google';
import { Characteristic } from '../hap-types.js';
import { ghToHap, ghToHap_t } from './ghToHapTypes.js';

export class Door extends ghToHap implements ghToHap_t {
  sync(service: ServiceType) {

    return this.createSyncData(service, {
      type: 'action.devices.types.DOOR',
      traits: ['action.devices.traits.OpenClose'],
      attributes: {
        openDirection: ['IN', 'OUT'],
      },
    });
  }

  query(service: ServiceType) {
    return {
      on: true,
      online: true,
      openPercent: service.serviceCharacteristics.find(x => x.uuid === Characteristic.CurrentPosition).value,
    };
  }

  async execute(service: ServiceType, command: SmartHomeV1ExecuteRequestCommands): Promise<SmartHomeV1ExecuteResponseCommands> {
    if (!command.execution.length) {
      return { ids: [service.uniqueId], status: 'ERROR', debugString: 'missing command' };
    }
    switch (command.execution[0].command) {
      case ('action.devices.commands.OpenClose'): {
        await service.serviceCharacteristics.find(x => x.uuid === Characteristic.TargetPosition).setValue(command.execution[0].params.openPercent);
        return { ids: [service.uniqueId], status: 'SUCCESS' };
      }
      default: { return { ids: [service.uniqueId], status: 'ERROR', debugString: `unknown command ${command.execution[0].command}` }; }
    }
  }
}
