import { ServiceType } from '@homebridge/hap-client';
import type { SmartHomeV1ExecuteRequestCommands, SmartHomeV1ExecuteResponseCommands, SmartHomeV1SyncDevices } from 'actions-on-google';
import { Characteristic, Service } from '../hap-types.js';
import { Hap } from '../hap.js';
import { ghToHap, ghToHap_t } from './ghToHapTypes.js';

export class Speaker extends ghToHap implements ghToHap_t {
  constructor(
    private hap: Hap,
  ) {
    super();
  }

  sync(service: ServiceType, primaryResponse?: SmartHomeV1SyncDevices) {
    const tv = this.hap.services.find(x => x.aid === service.aid && x.instance.username === service.instance.username && x.type === 'Television');

    if (tv && !Speaker.primaryService[service.uniqueId]) {
      Speaker.primaryService[service.uniqueId] = tv;
      Speaker.secondaryServices[tv.uniqueId] ??= [];
      Speaker.secondaryServices[tv.uniqueId].push(service);
    }

    const traits = [
      // 'action.devices.traits.MediaState',    // Required
      // 'action.devices.traits.OnOff',
      // 'action.devices.traits.TransportControl',
      // 'action.devices.traits.Volume',
      // 'action.devices.traits.AppSelector',   // Recommended
      // 'action.devices.traits.InputSelector',
    ];
    const attributes = {} as any;

    if (!primaryResponse?.traits.includes('action.devices.traits.OnOff')) {
      traits.push('action.devices.traits.OnOff');
      attributes.commandOnlyOnOff = false;
      attributes.queryOnlyOnOff = !service.serviceCharacteristics.find(x => x.uuid === Characteristic.Active);
    }
    const currentMediaState = service.serviceCharacteristics.find(x => x.uuid === Characteristic.CurrentMediaState);
    if (!primaryResponse?.traits.includes('action.devices.traits.MediaState')) {
      traits.push('action.devices.traits.MediaState');
      attributes.supportActivityState = false;
      attributes.supportPlaybackState = !!currentMediaState;
    }
    if (!primaryResponse?.traits.includes('action.devices.traits.TransportControl')) {
      traits.push('action.devices.traits.TransportControl');
      attributes.transportControlSupportedCommands = currentMediaState ?
        [
          'STOP',
          'RESUME',
          'PAUSE',
        ] : [];
    }
    if (!primaryResponse?.traits.includes('action.devices.traits.Volume')) {
      traits.push('action.devices.traits.Volume');
      attributes.volumeCanMuteAndUnmute = !!service.serviceCharacteristics.find(x => x.uuid === Characteristic.Mute);
      attributes.volumeMaxLevel = 20;   //Volume. Just in case for a relative operations
      attributes.commandOnlyVolume = true;
    }
    // console.log(service.serviceName, primaryResponse, traits, attributes);

    return this.createSyncData(service, {
      type: 'action.devices.types.SPEAKER',
      traits: traits,
      attributes: attributes,
    });
  }

  query(service: ServiceType, primaryResponse?: Record<string, any>) {
    let response = {} as any;

    if (primaryResponse?.online === undefined) {
      response.online = true;
    }
    if (primaryResponse?.on === undefined) {
      const active = service.serviceCharacteristics.find(x => x.uuid === Characteristic.Active);
      response.on = active ? !!active : true;
    }
    if (primaryResponse?.currentVolume === undefined) {
      const volume = service.serviceCharacteristics.find(x => x.uuid === Characteristic.Volume);
      response.currentVolume = volume ? Math.round(20 * Number(volume.value) / 100) : 10;
    }
    if (primaryResponse?.isMuted === undefined) {
      const mute = service.serviceCharacteristics.find(x => x.uuid === Characteristic.Mute);
      response.isMuted = mute ? !!mute.value : false;
    }
    if (primaryResponse?.playbackState === undefined) {
      const mediaState = service.serviceCharacteristics.find(x => x.uuid === Characteristic.CurrentMediaState);
      if (mediaState) {
        // response.activityState = response.on ? 'STANDBY' : 'INACTIVE';
        switch (mediaState.value) {
          case 0: // Characteristic.CurrentMediaState.PLAY:
            response.playbackState = 'PLAYING';
            break;
          case 1: // Characteristic.CurrentMediaState.PAUSE:
            response.playbackState = 'PAUSED';
            break;
          case 2: // Characteristic.CurrentMediaState.STOP:
            response.playbackState = 'STOPPED';
            break;
          case 4: // Characteristic.CurrentMediaState.LOADING:
          case 5: // Characteristic.CurrentMediaState.INTERRUPTED:
          default:
            response.playbackState = 'BUFFERING';
            break;
        }
      }
    }
    // console.log(service.serviceName, primaryResponse, response);

    return response;
  }

  async execute(service: ServiceType, command: SmartHomeV1ExecuteRequestCommands): Promise<SmartHomeV1ExecuteResponseCommands> {
    // console.log(service.serviceName, command);
    if (!command.execution.length) {
      return { ids: [service.uniqueId], status: 'ERROR', debugString: 'missing command' };
    }
    switch (command.execution[0].command) {
      case ('action.devices.commands.OnOff'): {
        const active = service.serviceCharacteristics.find(x => x.uuid === Characteristic.Active);
        if (active) {
          await active.setValue(command.execution[0].params.on ? 1 : 0);
          return { ids: [service.uniqueId], status: 'SUCCESS' };
        } else {
          return { ids: [service.uniqueId], status: 'ERROR', debugString: `unknown command ${command.execution[0].command}` };
        }
      }
      case ('action.devices.commands.mute'): {
        const mute = service.serviceCharacteristics.find(x => x.uuid === Characteristic.Mute);
        if (mute) {
          await mute.setValue(!!command.execution[0].params.mute);
          return { ids: [service.uniqueId], status: 'SUCCESS' };
        } else {
          return { ids: [service.uniqueId], status: 'ERROR', debugString: `unknown command ${command.execution[0].command}` };
        }
      }
      case ('action.devices.commands.setVolume'): {
        const volume = service.serviceCharacteristics.find(x => x.uuid === Characteristic.Volume);
        if (volume) {
          const volumeLevel = command.execution[0].params.volumeLevel * (100 / 20);
          await volume.setValue(volumeLevel);
          return { ids: [service.uniqueId], status: 'SUCCESS' };
        } else {
          return { ids: [service.uniqueId], status: 'ERROR', debugString: `unknown command ${command.execution[0].command}` };
        }
      }
      case ('action.devices.commands.volumeRelative'): {
        // public static readonly INCREMENT = 0;
        // public static readonly DECREMENT = 1;
        const volume = service.serviceCharacteristics.find(x => x.uuid === Characteristic.Volume);
        const volumeSelector = service.serviceCharacteristics.find(x => x.uuid === Characteristic.VolumeSelector);
        if (volumeSelector) {
          const relativeSteps = command.execution[0].params.relativeSteps;
          if (relativeSteps < 0 && volume && Number(volume?.value) <= 0) {
            return { ids: [service.uniqueId], status: 'ERROR', errorCode: 'volumeAlreadyMin', debugString: `unknown command ${command.execution[0].command}` };
          } else if (relativeSteps > 0 && volume?.value && Number(volume?.value) >= 100) {
            return { ids: [service.uniqueId], status: 'ERROR', errorCode: 'volumeAlreadyMax', debugString: `unknown command ${command.execution[0].command}` };
          } else {
            await volumeSelector.setValue(relativeSteps < 0 ? 1 : 0);
            return { ids: [service.uniqueId], status: 'SUCCESS' };
          }
        } else {
          return { ids: [service.uniqueId], status: 'ERROR', debugString: `unknown command ${command.execution[0].command}` };
        }
      }
      case ('action.devices.commands.mediaStop'):
      case ('action.devices.commands.mediaResume'):
      case ('action.devices.commands.mediaPause'): {
        // public static readonly PLAY = 0;
        // public static readonly PAUSE = 1;
        // public static readonly STOP = 2;
        const target = {
          'action.devices.commands.mediaStop': 2,
          'action.devices.commands.mediaResume': 0,
          'action.devices.commands.mediaPause': 1,
        }[command.execution[0].command];
        const targetMediaState = service.serviceCharacteristics.find(x => x.uuid === Characteristic.TargetMediaState);
        if (targetMediaState) {
          await targetMediaState.setValue(target);
          return { ids: [service.uniqueId], status: 'SUCCESS' };
        }
        return { ids: [service.uniqueId], status: 'ERROR', debugString: `unknown command ${command.execution[0].command}` };
      }
      default: { return { ids: [service.uniqueId], status: 'ERROR', debugString: `unknown command ${command.execution[0].command}` }; }
    }
  }
}
