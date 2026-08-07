import { ServiceType } from '@homebridge/hap-client';
import { SmartHomeV1ExecuteRequestCommands, SmartHomeV1ExecuteResponseCommands } from 'actions-on-google';
import { Characteristic } from '../hap-types';
import { ghToHap, ghToHap_t } from './ghToHapTypes';

export class ContactSensor extends ghToHap implements ghToHap_t {
  sync(service: ServiceType) {
    return this.createSyncData(service, {
      type: 'action.devices.types.SENSOR',
      traits: [
        'action.devices.traits.OpenClose',
      ],
      attributes: {
        discreteOnlyOpenClose: true,
        openDirection: ['LEFT', 'RIGHT'],
        queryOnlyOpenClose: true,
      },
    });
  }

  query(service: ServiceType) {
    return {
      online: true,
      openPercent: service.serviceCharacteristics.find(x => x.uuid === Characteristic.ContactSensorState)?.value ? 100: 0,
    } as any;
  }

  async execute(service: ServiceType, command: SmartHomeV1ExecuteRequestCommands): Promise<SmartHomeV1ExecuteResponseCommands> {
    if (!command.execution.length) {
      return { ids: [service.uniqueId], status: 'ERROR', debugString: 'missing command' };
    }
    return { ids: [service.uniqueId], status: 'ERROR', debugString: `unknown command ${command.execution[0].command}` };
  }
}
