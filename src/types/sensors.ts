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

  sync(service: ServiceType, primaryResponse?: SmartHomeV1SyncDevices): SmartHomeV1SyncDevices {
    if (!Sensor.secondaryServices[service.uniqueId] && !Sensor.primaryService[service.uniqueId]) {
      const services = this.hap.services.filter(x => x.aid === service.aid && x.instance.username === service.instance.username) ?? [];
      const primaryService = services
        .filter(x => Object.keys(this.hap.types).includes(x.type))
        .filter(x => !this.hap.sensorServices.includes(x.type))?.[0]; // select first one.
      let primarySensor = undefined;

      Object.keys(this.hap.sensorTypes).forEach(sensor => {
        const sensors = services.filter(x => x.type === sensor);
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
            Sensor.secondaryServices[primarySensor.uniqueId] = [];
            if (primaryService) {
              Sensor.primaryService[primarySensor.uniqueId] = primaryService;
              Sensor.secondaryServices[primaryService.uniqueId] = [primarySensor];
            }
          } else {
            Sensor.primaryService[sensorService.uniqueId] = primarySensor;
            Sensor.secondaryServices[primarySensor.uniqueId].push(sensorService);
          }
          // console.log('type:', service.type, ',primary:', primarySensor.serviceName, ',secondary:', sensorService.type);
        }
      });
    }
    const response = this.hap.sensorTypes[service.type].sync(service, primaryResponse);
    // console.log(response);

    return response;
  }

  query(service: ServiceType, primaryResponse?: SmartHomeV1SyncDevices) {
    const response = this.hap.sensorTypes[service.type].query(service, primaryResponse);
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
