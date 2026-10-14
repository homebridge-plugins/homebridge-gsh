import { ServiceType } from '@homebridge/hap-client';
import type { SmartHomeV1ExecuteRequestCommands, SmartHomeV1ExecuteResponseCommands } from 'actions-on-google';
import { Characteristic } from '../hap-types.js';
import { ghToHap, ghToHap_t } from './ghToHapTypes.js';

/**
 * Doorbell - https://developers.home.google.com/cloud-to-cloud/guides/doorbell
 *
 * Exposed as action.devices.types.DOORBELL with the ObjectDetection trait. Doorbell
 * presses are delivered to Google as notifications rather than state, so there is no
 * queryable state beyond online, and no supported commands.
 */
export class Doorbell extends ghToHap implements ghToHap_t {
  sync(service: ServiceType) {
    this.lastValues[service.uniqueId] = this.otherValues(service);
    return this.createSyncData(service, {
      type: 'action.devices.types.DOORBELL',
      traits: [
        'action.devices.traits.ObjectDetection',
      ],
      notificationSupportedByAgent: true,
    });
  }

  query(service: ServiceType) {
    return {
      online: true,
    } as any;
  }

  /**
   * HAP raises an event for every 'ev' characteristic on the service, including optional ones
   * such as Volume or Mute. Only treat the event as a press when none of the other
   * characteristic values changed since the last event.
   */
  private lastValues: Record<string, string> = {};

  isPress(service: ServiceType): boolean {
    const otherValues = this.otherValues(service);
    const previous = this.lastValues[service.uniqueId];
    this.lastValues[service.uniqueId] = otherValues;
    return previous === undefined || previous === otherValues;
  }

  private otherValues(service: ServiceType) {
    return JSON.stringify(service.serviceCharacteristics
      .filter(x => x.uuid !== Characteristic.ProgrammableSwitchEvent)
      .map(x => [x.uuid, x.value]));
  }

  /**
   * Build the ObjectDetection notification for a doorbell press
   */
  notification(service: ServiceType, detectionTimestamp = Date.now()) {
    return {
      [service.uniqueId]: {
        ObjectDetection: {
          objects: {
            unclassified: 1,
          },
          priority: 0,
          detectionTimestamp,
        },
      },
    };
  }

  async execute(service: ServiceType, command: SmartHomeV1ExecuteRequestCommands): Promise<SmartHomeV1ExecuteResponseCommands> {
    if (!command.execution.length) {
      return { ids: [service.uniqueId], status: 'ERROR', debugString: 'missing command' };
    }
    return { ids: [service.uniqueId], status: 'ERROR', debugString: `unknown command ${command.execution[0].command}` };
  }
}
