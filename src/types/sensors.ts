import type { SmartHomeV1ExecuteRequestCommands, SmartHomeV1ExecuteResponseCommands, SmartHomeV1SyncDevices } from 'actions-on-google';
import { ServiceType } from '@homebridge/hap-client';
import { Hap } from '../hap.js';
import { ghToHap, ghToHap_t } from './ghToHapTypes.js';

export class Sensor extends ghToHap implements ghToHap_t {
  constructor(
    private hap?: Hap,
  ) {
    super();
  }

  private primaryService = {};
  private secondaryServices = {};
  private syncing = true;

  sync(service: ServiceType, primaryResponse?: SmartHomeV1SyncDevices): SmartHomeV1SyncDevices | undefined {
    const response = {
      type: 'action.devices.types.SENSOR',
      traits: [],
      attributes: {},
    };
    
    if (this.syncing === false) {       // switch to syncing
      this.primaryService = {};
      this.secondaryServices = {};
      this.syncing = true;
    }
    if (!this.secondaryServices[service.uniqueId] && !this.primaryService[service.uniqueId]) {
      const services = this.hap.services.filter(x => x.aid === service.aid && x.instance.username === service.instance.username) ?? [];
      const primaryService = services
        .filter(x => Object.keys(this.hap.types).includes(x.type))
        .filter(x => !this.hap.sensorServices.includes(x.type))?.[0]; // select first one.
      let primarySensor = undefined;

      Object.keys(this.hap.sensorTypes).forEach(sensor => {
        const sensors = services.filter(x => x.type === sensor).map(x => {
          this.secondaryServices[x.uniqueId] = [x]; // initialize
          return x;
        });
        if (sensors.length > 1) { // multiple instances
          sensors.forEach(x => this.hap.log.warn(`Skipped to combine ${x.type} due to multiple service instances. ${x.serviceName}`));
          return;
        }
        const sensorService = sensors?.[0];
        if (sensorService) {
          if (sensorService.type === 'ContactSensor'
            && ['Door', 'GarageDoorOpener', 'Window', 'WindowCovering'].includes(primaryService?.type)) {
            this.hap.log.error(`Unable to combine ${sensorService.serviceName} due to conflicting traits. ${primaryService.serviceName}`);
            return;
          }
          if (primarySensor === undefined) {
            primarySensor = sensorService;
            this.secondaryServices[primarySensor.uniqueId] = [];
            if (primaryService) {
              this.primaryService[primarySensor.uniqueId] = primaryService;
              this.hap.types[primaryService.type].secondaryServices[primaryService.uniqueId] = [primarySensor];
            }
          } else {
            this.primaryService[sensorService.uniqueId] = primarySensor;
          }
          // console.log('type:', service.type, ',primary:', primarySensor.serviceName, ',secondary:', sensorService.type);
          this.secondaryServices[primarySensor.uniqueId].push(sensorService);
        }
      });
    }
    // Primary non-sensor service might respond earlier without sensor properties.
    // Create the response to overwrite it.
    if (Object.keys(this.hap.sensorTypes).includes(this.primaryService[service.uniqueId]?.type)) {
      return undefined;
    }

    const primary = this.primaryService[service.uniqueId]; // Primary non-sensor service
    if (primary && !primaryResponse) {
      // upward traversal to find a root node.
      return this.hap.types[primary.type].sync(primary); // responds as root node.
    }
    // root node or received root node response. collect secondary responses.
    this.secondaryServices[service.uniqueId]?.forEach(sensor => {
      const update = this.hap.sensorTypes[sensor.type].sync(sensor);
      response.traits = [...response.traits, ...update.traits];
      response.attributes = {...response.attributes, ...update.attributes};
    });
    // console.log(response);

    return this.createSyncData(service, response);
  }

  query(service: ServiceType, primaryResponse?: SmartHomeV1SyncDevices) {
    this.syncing = false;       // switch to query
    let response = {
      online: true,
    } as any;

    const primary = this.primaryService[service.uniqueId];
    if (primary && !primaryResponse) {
      // upward traversal to find a root node
      response = this.hap.types[primary.type].query(primary);
      response['id'] ??= primary.uniqueId; // responds as root node.
      return response;
    }
    // root node or received root node response. collect secondary responses.
    this.secondaryServices[service.uniqueId]?.forEach(sensor => {
      const update = this.hap.sensorTypes[sensor.type].query(sensor);
      Object.assign(response, update);
    });
    // console.log(response);

    return response;
  }

  async execute(service: ServiceType, command: SmartHomeV1ExecuteRequestCommands): Promise<SmartHomeV1ExecuteResponseCommands> {
    if (!command.execution.length) {
      return { ids: [service.uniqueId], status: 'ERROR', debugString: 'missing command' };
    }
    return { ids: [service.uniqueId], status: 'ERROR', debugString: `unknown command ${command.execution[0].command}` };
  }
}
