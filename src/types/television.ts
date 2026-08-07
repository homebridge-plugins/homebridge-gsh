/* eslint-disable max-len */

import { ServiceType } from '@homebridge/hap-client';
import { SmartHomeV1ExecuteRequestCommands, SmartHomeV1ExecuteResponseCommands } from 'actions-on-google';
import { Characteristic, Service } from '../hap-types.js';
import { Hap } from '../hap.js';
import { ghToHap, ghToHap_t } from './ghToHapTypes.js';

export class Television extends ghToHap implements ghToHap_t {
  constructor(
    private hap: Hap,
  ) {
    super();
  }

  private instances = {};

  sync(service: ServiceType) {
    if (!this.instances[service.uniqueId]) {
      this.instances[service.uniqueId] = {
        Mute: [],
        volumeSelector: [],
        channels: [],
        lastChannel: undefined,
        inputs: [],
      };
    }
    const instance = this.instances[service.uniqueId];

    // console.log(`${service.type}: ${service.instance.username}, aid:${service.aid}, iid:${service.iid}, name: ${service.serviceName}`);
    const x = this.hap.services.filter(x => x.aid === service.aid && x.instance.username === service.instance.username) ?? [];

    for (const speaker of x.filter(x => x.uuid === Service.Speaker)) {
      instance.Mute = [];
      for (const c of speaker.serviceCharacteristics.filter(x => x.uuid === Characteristic.Mute)) {
        // console.log(`  ${speaker.type}: ${speaker.serviceName}, ${c.type}: ${c.serviceName}`);
        instance.Mute.push(c);
      }
      instance.volumeSelector = [];
      for (const c of speaker.serviceCharacteristics.filter(x => x.uuid === Characteristic.VolumeSelector)) {
        // console.log(`  ${speaker.type}: ${speaker.serviceName}, ${c.type}: ${c.serviceName}`);
        instance.volumeSelector.push(c);
      }
    }

    instance.channels = [];
    instance.inputs = [];
    for (const input of x.filter(x => x.uuid === Service.InputSource)) {    // service.linked is better?
      if (input.serviceCharacteristics.find(x => x.uuid === Characteristic.CurrentVisibilityState)?.value) {
        continue;       // hidden input source
      }
      const cname = input.serviceCharacteristics.find(x => x.uuid === Characteristic.ConfiguredName)?.value as string;
      const c = {
        serviceName: input.serviceName,
        Identifier: input.serviceCharacteristics.find(x => x.uuid === Characteristic.Identifier)?.value,
        InputSourceType: input.serviceCharacteristics.find(x => x.uuid === Characteristic.InputSourceType)?.value,
      } as any;
      if (cname.substring(0, 10) === 'Station - ') {
        c.ConfiguredName = cname.substring(10);
        instance.channels.push(c);
      } else {
        c.ConfiguredName = cname;
        instance.inputs.push(c);
      }
    }
    instance.lastChannel = instance.channels[0]?.Identifier;    // need to keep between syncing?
    // console.log(`${service.type}: ${service.instance.username}, aid:${service.aid}, iid:${service.iid}, name: ${service.serviceName}`);
    // console.log(`channels: ${JSON.stringify(this.instances[service.uniqueId].channels, null, 2)}`);
    // console.log(`inputs: ${JSON.stringify(this.instances[service.uniqueId].inputs, null, 2)}`);

    const traits = [
      'action.devices.traits.OnOff',
      'action.devices.traits.MediaState',
      //'action.devices.traits.Modes',
      //'action.devices.traits.Toggles',
      'action.devices.traits.AppSelector',
      'action.devices.traits.TransportControl',
    ];
    const attributes = {
      commandOnlyOnOff: false,  //OnOff
      queryOnlyOnOff: false,
      supportActivityState: service.serviceCharacteristics.find(x => x.uuid === Characteristic.CurrentMediaState) ? true : false,
      supportPlaybackState: service.serviceCharacteristics.find(x => x.uuid === Characteristic.CurrentMediaState) ? true : false,
    } as any;
    attributes.availableApplications = [];
    attributes.transportControlSupportedCommands = [];
    if (service.serviceCharacteristics.find(x => x.uuid === Characteristic.RemoteKey)) {
      attributes.transportControlSupportedCommands = [
        'STOP',
        'RESUME',
        'PAUSE',
        'NEXT',
        'PREVIOUS',
      ];
    }
    if (instance.volumeSelector.find(x => x.uuid === Characteristic.VolumeSelector)) {
      traits.push('action.devices.traits.Volume');
      attributes.volumeCanMuteAndUnmute = instance.Mute.find(x => x.uuid === Characteristic.Mute) ? true : false;
      attributes.volumeMaxLevel = 20;   //Volume. Just in case for a relative operations
      attributes.commandOnlyVolume = true;
    }
    if (instance.channels.length > 0) {
      traits.push('action.devices.traits.Channel');
      attributes.commandOnlyChannels = false;
      attributes.availableChannels = [];
      for (const c of instance.channels) {
        const n = [c.ConfiguredName];
        const a = this.hap.config.channelAlias?.find(x => x.channel === c.ConfiguredName);
        if (a) {
          for (const x of a.alias) {
            n.push(x);
          }
        }
        attributes.availableChannels.push({
          key: c.serviceName,
          names: n,
          number: `${c.Identifier + 1}`,
        });
      }
    }
    if (instance.inputs.length > 0) {
      traits.push('action.devices.traits.InputSelector');
      attributes.commandOnlyInputSelector = false;
      attributes.orderedInputs = true;
      attributes.availableInputs = [];
      if (attributes.availableChannels?.length > 0) {
        attributes.availableInputs.push({
          key: '_tv',   //dummy for stations
          names: [
            {
              lang: 'en',
              name_synonym: [
                '_tv',
              ],
            },
          ],
        });
      }
      for (const c of instance.inputs) {
        attributes.availableInputs.push({
          key: c.serviceName,
          names: [
            {
              lang: 'en',
              name_synonym: [
                c.ConfiguredName,
              ],
            },
          ],
        });
      }
    }
    // console.log(JSON.stringify(traits, null, 2));
    // console.log(JSON.stringify(attributes, null, 2));

    return this.createSyncData(service, {
      type: 'action.devices.types.TV',
      traits: traits,
      attributes: attributes,
    });
  }

  query(service: ServiceType) {

    const instance = this.instances[service.uniqueId];
    const response = {
      on: !!service.serviceCharacteristics.find(x => x.uuid === Characteristic.Active).value,
      online: true,
    } as any;
    if (instance.volumeSelector.find(x => x.uuid === Characteristic.VolumeSelector)) {
      response.currentVolume = 10;
    }
    const cMute = instance.Mute.find(x => x.uuid === Characteristic.Mute);
    if (cMute) {
      response.isMuted = cMute.value ? true : false;
    }
    const cActive = service.serviceCharacteristics.find(x => x.uuid === Characteristic.ActiveIdentifier);
    if (cActive) {
      const lastChannel = instance.channels.find(x => x.Identifier === cActive.value);
      if (lastChannel) {
        instance.lastChannel = lastChannel.Identifier;
      }
      if (instance.inputs.length > 0) {
        response.currentInput = instance.inputs.find(x => x.Identifier === cActive.value)?.serviceName ?? '_tv';
      }
    }
    const cState = service.serviceCharacteristics.find(x => x.uuid === Characteristic.CurrentMediaState);
    if (cState) {
      // public static readonly PLAY = 0;
      // public static readonly PAUSE = 1;
      // public static readonly STOP = 2;
      // public static readonly LOADING = 4;
      // public static readonly INTERRUPTED = 5;
      response.activityState = response.on ? 'STANDBY' : 'INACTIVE';
      switch (cState.value) {
        case 0:
          response.playbackState = 'PLAYING';
          break;
        case 1:
          response.playbackState = 'PAUSED';
          break;
        case 2:
          response.playbackState = 'STOPPED';
          break;
        case 4:
        case 5:
        default:
          response.playbackState = 'BUFFERING';
          break;
      }
    }
    // console.log(service.serviceName, response);
    // console.log(`${JSON.stringify(instance, null, 2)}`);

    return response;

    // return {
    //   on: !!service.serviceCharacteristics.find(x => x.uuid === Characteristic.Active).value,
    //   online: true,
    // };
  }

  async execute(service: ServiceType, command: SmartHomeV1ExecuteRequestCommands): Promise<SmartHomeV1ExecuteResponseCommands> {
    const instance = this.instances[service.uniqueId];
    if (!command.execution.length) {
      return { ids: [service.uniqueId], status: 'ERROR', debugString: 'missing command' };
    }
    switch (command.execution[0].command) {
      case ('action.devices.commands.OnOff'): {
        await service.serviceCharacteristics.find(x => x.uuid === Characteristic.Active).setValue(command.execution[0].params.on ? 1 : 0);
        return { ids: [service.uniqueId], status: 'SUCCESS' };
      }
      case ('action.devices.commands.mute'): {
        await instance.Mute.find(x => x.uuid === Characteristic.Mute).setValue(command.execution[0].params.mute ? 1 : 0);
        return { ids: [service.uniqueId], status: 'SUCCESS' };
      }
      // case ('action.devices.commands.setVolume'): {  // No proper characteristic
      // }
      case ('action.devices.commands.volumeRelative'): {
        // Characteristic.VolumeSelector.INCREMENT = 0;
        // Characteristic.VolumeSelector.DECREMENT = 1;
        await instance.volumeSelector.find(x => x.uuid === Characteristic.VolumeSelector).setValue(command.execution[0].params.relativeSteps < 0 ? 1 : 0);
        return { ids: [service.uniqueId], status: 'SUCCESS' };
      }
      case ('action.devices.commands.selectChannel'): {
        if (command.execution[0].params?.channelCode) {
          const code = command.execution[0].params.channelCode;
          const c = instance.channels.find(x => x.serviceName === code);
          if (c) {
            await service.serviceCharacteristics.find(x => x.uuid === Characteristic.ActiveIdentifier).setValue(c.Identifier);
            instance.lastChannel = c.Identifier;
            return { ids: [service.uniqueId], status: 'SUCCESS' };
          }
        } else if (command.execution[0].params?.channelNumber) {
          const number = parseInt(command.execution[0].params.channelNumber) - 1;
          const c = instance.channels.find(x => x.Identifier === number);
          if (c) {
            await service.serviceCharacteristics.find(x => x.uuid === Characteristic.ActiveIdentifier).setValue(c.Identifier);
            instance.lastChannel = c.Identifier;
            return { ids: [service.uniqueId], status: 'SUCCESS' };
          }
          //} else if (command.execution[0].params?.channelName) {
        }
        return { ids: [service.uniqueId], status: 'ERROR', 'errorCode': 'channelSwitchFailed', debugString: `unknown command ${command.execution[0].command}` };
      }
      case ('action.devices.commands.relativeChannel'): {
        if (!instance.lastChannel) {    // no channels available
          return { ids: [service.uniqueId], status: 'ERROR', 'errorCode': 'channelSwitchFailed', debugString: `unknown command ${command.execution[0].command}` };
        }
        const change = command.execution[0].params?.relativeChannelChange;
        const n = instance.channels.length;
        let c = instance.channels.findIndex(x => x.Identifier === instance.lastChannel);
        c = c < 0 ? n - 1 : c;
        // const d = service.serviceCharacteristics.find(x => x.uuid === Characteristic.serviceName).value;
        // console.log(`Current channel index of ${d} is ${c}.`);
        if (change > 0) {
          if (++c > n - 1) {
            c = 0;
          }
        } else if (change < 0) {
          if (--c < 0) {
            c = n - 1;
          }
        }
        // console.log(`Updated channel index of ${d} to ${c}.`);
        c = instance.channels[c].Identifier;
        await service.serviceCharacteristics.find(x => x.uuid === Characteristic.ActiveIdentifier).setValue(c);
        instance.lastChannel = c;
        return { ids: [service.uniqueId], status: 'SUCCESS' };
      }
      case ('action.devices.returnChannel'): {
        if (!instance.lastChannel) {    // no channels available
          return { ids: [service.uniqueId], status: 'ERROR', 'errorCode': 'channelSwitchFailed', debugString: `unknown command ${command.execution[0].command}` };
        }
        await service.serviceCharacteristics.find(x => x.uuid === Characteristic.ActiveIdentifier).setValue(instance.lastChannel);
        return { ids: [service.uniqueId], status: 'SUCCESS' };
      }
      case ('action.devices.commands.SetInput'): {
        const input = command.execution[0].params?.newInput;
        if (input === '_tv') {          // might be selected in UI
          if (!instance.lastChannel) {  // won't happen. just in case.
            return { ids: [service.uniqueId], status: 'ERROR', 'errorCode': 'unsupportedInput', debugString: `unknown command ${command.execution[0].command}` };
          } else {
            await service.serviceCharacteristics.find(x => x.uuid === Characteristic.ActiveIdentifier).setValue(instance.lastChannel);
            return { ids: [service.uniqueId], status: 'SUCCESS' };
          }
        }
        const c = instance.inputs.find(x => x.serviceName === input);
        if (c) {
          await service.serviceCharacteristics.find(x => x.uuid === Characteristic.ActiveIdentifier).setValue(parseInt(c.Identifier));
          return { ids: [service.uniqueId], status: 'SUCCESS', states: { currentInput: c.serviceName } };
        }
        return { ids: [service.uniqueId], status: 'ERROR', 'errorCode': 'unsupportedInput', debugString: `unknown command ${command.execution[0].command}` };
      }
      case ('action.devices.commands.NextInput'): {
        let c = service.serviceCharacteristics.find(x => x.uuid === Characteristic.ActiveIdentifier).value as number;
        const n = instance.inputs.length;
        if (instance.channels.find(x => x.Identifier === c)) {
          c = -1;
        } else {
          c = instance.inputs.findIndex(x => x.Identifier === c);
        }
        // const d = service.serviceCharacteristics.find(x => x.uuid === Characteristic.Name).value;
        // console.log(`Current input index of ${d} is ${c}.`);
        if (++c > n - 1) {
          c = 0;
        }
        // console.log(`Updated input index of ${d} to ${c}.`);
        c = instance.inputs[c]?.Identifier;
        await service.serviceCharacteristics.find(x => x.uuid === Characteristic.ActiveIdentifier).setValue(c);
        return { ids: [service.uniqueId], status: 'SUCCESS', states: { currentInput: instance.inputs.find(x => x.Identifier === c).serviceName } };
      }
      case ('action.devices.commands.PreviousInput'): {
        let c = service.serviceCharacteristics.find(x => x.uuid === Characteristic.ActiveIdentifier).value as number;
        const n = instance.inputs.length;
        if (instance.channels.find(x => x.Identifier === c)) {
          c = -1;
        } else {
          c = instance.inputs.findIndex(x => x.Identifier === c);
        }
        // const d = service.serviceCharacteristics.find(x => x.uuid === Characteristic.Name).value;
        // console.log(`Current input index of ${d} is ${c}.`);
        if (--c < 0) {
          c = n - 1;
        }
        // console.log(`Updated input index of ${d} to ${c}.`);
        c = instance.inputs[c]?.Identifier;
        await service.serviceCharacteristics.find(x => x.uuid === Characteristic.ActiveIdentifier).setValue(c);
        return { ids: [service.uniqueId], status: 'SUCCESS', states: { currentInput: instance.inputs.find(x => x.Identifier === c).serviceName } };
      }
      // Characteristic.RemoteKey.REWIND = 0;
      // Characteristic.RemoteKey.FAST_FORWARD = 1;
      // Characteristic.RemoteKey.NEXT_TRACK = 2;
      // Characteristic.RemoteKey.PREVIOUS_TRACK = 3;
      // Characteristic.RemoteKey.ARROW_UP = 4;
      // Characteristic.RemoteKey.ARROW_DOWN = 5;
      // Characteristic.RemoteKey.ARROW_LEFT = 6;
      // Characteristic.RemoteKey.ARROW_RIGHT = 7;
      // Characteristic.RemoteKey.SELECT = 8;
      // Characteristic.RemoteKey.BACK = 9;
      // Characteristic.RemoteKey.EXIT = 10;
      // Characteristic.RemoteKey.PLAY_PAUSE = 11;
      // Characteristic.RemoteKey.INFORMATION = 15;
      case ('action.devices.commands.mediaStop'): {
        await service.serviceCharacteristics.find(x => x.uuid === Characteristic.RemoteKey).setValue(9); // Characteristic.RemoteKey.BACK,
        return { ids: [service.uniqueId], status: 'SUCCESS' };
      }
      case ('action.devices.commands.mediaResume'): {
        await service.serviceCharacteristics.find(x => x.uuid === Characteristic.RemoteKey).setValue(8); // Characteristic.RemoteKey.SELECT,
        return { ids: [service.uniqueId], status: 'SUCCESS' };
      }
      case ('action.devices.commands.mediaPause'): {
        await service.serviceCharacteristics.find(x => x.uuid === Characteristic.RemoteKey).setValue(11); // Characteristic.RemoteKey.PLAY_PAUSE,
        return { ids: [service.uniqueId], status: 'SUCCESS' };
      }
      case ('action.devices.commands.mediaNext'): {
        if (this.hap.config.enhancedSkip === true && service.accessoryInformation.Manufacturer === 'Apple Inc.') {
          await service.serviceCharacteristics.find(x => x.uuid === Characteristic.RemoteKey).setValue(8); // Characteristic.RemoteKey.SELECT,
        } else {
          await service.serviceCharacteristics.find(x => x.uuid === Characteristic.RemoteKey).setValue(7); // Characteristic.RemoteKey.ARROW_RIGHT,
        }
        return { ids: [service.uniqueId], status: 'SUCCESS' };
      }
      case ('action.devices.commands.mediaPrevious'): {
        await service.serviceCharacteristics.find(x => x.uuid === Characteristic.RemoteKey).setValue(6); // Characteristic.RemoteKey.ARROW_LEFT,
        return { ids: [service.uniqueId], status: 'SUCCESS' };
      }
      default: { return { ids: [service.uniqueId], status: 'ERROR', debugString: `unknown command ${command.execution[0].command}` }; }
    }
  }
}
