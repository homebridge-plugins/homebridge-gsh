import { ServiceType } from '@homebridge/hap-client';
import type { SmartHomeV1ExecuteRequestCommands, SmartHomeV1ExecuteResponseCommands } from 'actions-on-google';
import { Characteristic } from '../hap-types.js';
import { ghToHap, ghToHap_t } from './ghToHapTypes.js';

export class SecuritySystem extends ghToHap implements ghToHap_t {
  public twoFactorRequired = true;
  public returnStateOnExecute = true;

  sync(service: ServiceType) {

    return this.createSyncData(service, {
      type: 'action.devices.types.SECURITYSYSTEM',
      traits: [
        'action.devices.traits.ArmDisarm',
      ],
      attributes: {
        availableArmLevels: {
          levels: [
            {
              level_name: 'HOME',
              level_values: [{
                level_synonym: ['Home'],
                lang: 'en',
              }, {
                level_synonym: ['Anwesend'],
                lang: 'de',
              }],
            },
            {
              level_name: 'AWAY',
              level_values: [{
                level_synonym: ['Away'],
                lang: 'en',
              }, {
                level_synonym: ['Abwesend'],
                lang: 'de',
              }],
            },
            {
              level_name: 'NIGHT',
              level_values: [{
                level_synonym: ['Night'],
                lang: 'en',
              }, {
                level_synonym: ['Nacht'],
                lang: 'de',
              }],
            },
          ],
          ordered: true,
        },
      },
    });

  }

  query(service: ServiceType) {
    const availableSystemCurrentStates = ['HOME', 'AWAY', 'NIGHT', 'OFF'];

    const response = {
      on: true,
      online: true,
      //  status: 'SUCCESS',
    } as any;

    const securitySystemCurrentState: number = Number(service.serviceCharacteristics.find(x => x.uuid === Characteristic.SecuritySystemCurrentState).value);

    const currentArmLevel = availableSystemCurrentStates[securitySystemCurrentState];

    if (currentArmLevel === 'OFF') {
      response.isArmed = false;
    } else {
      response.isArmed = true;
      response.currentArmLevel = currentArmLevel;
    }

    return response;
  }

  async execute(service: ServiceType, command: SmartHomeV1ExecuteRequestCommands): Promise<SmartHomeV1ExecuteResponseCommands> {
    if (!command.execution.length) {
      return { ids: [service.uniqueId], status: 'ERROR', debugString: 'missing command' };
    }

    switch (command.execution[0].command) {
      case ('action.devices.commands.ArmDisarm'): {
        const mode = {
          HOME: 0,
          AWAY: 1,
          NIGHT: 2,
          OFF: 3,
        };

        let securitySystemTargetState;

        if (command.execution[0].params.arm === true) {
          securitySystemTargetState = mode[command.execution[0].params.armLevel];
        } else {
          securitySystemTargetState = mode.OFF;
        }

        await service.serviceCharacteristics.find(x => x.uuid === Characteristic.SecuritySystemTargetState).setValue(securitySystemTargetState);

        const states = {
          isArmed: command.execution[0].params.arm,
          currentArmLevel: command.execution[0].params.armLevel,
        };
        return { ids: [service.uniqueId], status: 'SUCCESS', states };
      }
      default: { return { ids: [service.uniqueId], status: 'ERROR', debugString: `unknown command ${command.execution[0].command}` }; }
    }
  }

  is2faRequired(command): boolean {
    if (!command.execution.length) {
      return false;
    }

    switch (command.execution[0].command) {
      case ('action.devices.commands.ArmDisarm'): {
        if (command.execution[0].params.arm === true) {
          return false;
        }

        return true;
      }
    }

    return false;
  }
}
