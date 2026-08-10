import { Config, HapClient, ServiceType } from '@homebridge/hap-client';
import { SmartHomeV1ExecuteRequestCommands, SmartHomeV1ExecuteResponseCommands, SmartHomeV1SyncDevices } from 'actions-on-google';
import * as fs from 'fs';
import { Subject } from 'rxjs';
import { debounceTime, map } from 'rxjs/operators';
import { Characteristic } from './hap-types.js';

import { PluginConfig } from './interfaces.js';
import { Log } from './logger.js';
import { Door } from './types/door.js';

import type { API } from 'homebridge';
import { createHash } from 'node:crypto';
import { Battery } from './types/battery-status.js';
import { ContactSensor } from './types/contact-sensor.js';
import { Fanv2 } from './types/fan-v2.js';
import { Fan } from './types/fan.js';
import { GarageDoorOpener } from './types/garage-door-opener.js';
import { HeaterCooler } from './types/heater-cooler.js';
import { HumiditySensor } from './types/humidity-sensor.js';
import { Lightbulb } from './types/lightbulb.js';
import { LockMechanism } from './types/lock-mechanism.js';
import { MotionSensor } from './types/motion-sensor.js';
import { OccupancySensor } from './types/occupancy-sensor.js';
import { SecuritySystem } from './types/security-system.js';
import { Switch } from './types/switch.js';
import { Television } from './types/television.js';
import { TemperatureSensor } from './types/temperature-sensor.js';
import { Thermostat } from './types/thermostat.js';
import { WindowCovering } from './types/window-covering.js';
import { Window } from './types/window.js';
import { Sensor } from './types/sensors.js';

export class Hap {
  socket;
  log: Log;
  pin: string;
  config: PluginConfig;
  hapClient: HapClient;
  services: ServiceType[] = [];
  private startTimeout: NodeJS.Timeout;
  private discoveryTimeout: NodeJS.Timeout;
  private syncTimeout: NodeJS.Timeout;
  private api: API;
  private configDiscoveryTimeout: number;
  private configDiscoveryWait: number;

  public ready: boolean;

  private dummy = () => { };

  /* GSH Supported types */
  types = {
    Door: new Door(),
    Fan: new Fan(),
    Fanv2: new Fanv2(),
    GarageDoorOpener: new GarageDoorOpener(),
    HeaterCooler: new HeaterCooler(this),
    HumiditySensor: new HumiditySensor(),
    Lightbulb: new Lightbulb(),
    LockMechanism: new LockMechanism(),
    Outlet: new Switch(),
    SecuritySystem: new SecuritySystem(),
    Switch: new Switch(),
    Television: new Television(this),
    TemperatureSensor: new TemperatureSensor(this),
    Thermostat: new Thermostat(this),
    Window: new Window(),
    WindowCovering: new WindowCovering(),
    Speaker: this.dummy,
    InputSource: this.dummy,
    ContactSensor: new ContactSensor(),
    OccupancySensor: new OccupancySensor(),
    MotionSensor: new MotionSensor(),
    Battery: new Battery(),
  };

  sensorServices = [
    'TemperatureSensor',
    'HumiditySensor',
    'OccupancySensor',
    'ContactSensor',
    'MotionSensor',
    'Battery',
  ];

  sensors = new Sensor(this) as any;
  sensorTypes: Record<string, any> = {};

  /* event tracking */
  // evInstances: Instance[] = [];
  // evServices: ServiceType[] = [];
  reportStateSubject = new Subject();
  pendingStateReport = [];

  /* types of characteristics to track */
  evTypes = [
    Characteristic.Active,
    Characteristic.On,
    Characteristic.CurrentPosition,
    Characteristic.TargetPosition,
    Characteristic.CurrentDoorState,
    Characteristic.TargetDoorState,
    Characteristic.Brightness,
    Characteristic.HeatingThresholdTemperature,
    Characteristic.Hue,
    Characteristic.Saturation,
    Characteristic.LockCurrentState,
    Characteristic.LockTargetState,
    Characteristic.TargetHeatingCoolingState,
    Characteristic.TargetTemperature,
    Characteristic.CoolingThresholdTemperature,
    Characteristic.CurrentTemperature,
    Characteristic.CurrentRelativeHumidity,
    Characteristic.SecuritySystemTargetState,
    Characteristic.SecuritySystemCurrentState,
    Characteristic.ActiveIdentifier,
    Characteristic.Mute,
    Characteristic.ContactSensorState,
    Characteristic.OccupancyDetected,
    Characteristic.CurrentMediaState,
    Characteristic.MotionDetected,
    Characteristic.StatusLowBattery,
    Characteristic.BatteryLevel,
  ];

  instanceBlacklist: Array<string> = [];
  accessoryFilter: Array<string> = [];
  accessoryFilterInverse: boolean;
  accessorySerialFilter: Array<string> = [];
  // deviceNameMap: Array<{ replace: string; with: string }> = [];

  constructor(socket, log, pin: string, config: PluginConfig, api) {
    this.config = config;
    this.socket = socket;
    this.log = log;
    this.pin = pin;
    this.api = api;

    this.configDiscoveryTimeout = (config.discoveryTimeout ? config.discoveryTimeout : 5);
    this.configDiscoveryWait = (config.discoveryWait ? config.discoveryWait : 15);

    this.accessoryFilter = config.accessoryFilter || [];
    this.accessoryFilterInverse = config.accessoryFilterInverse || false;
    this.accessorySerialFilter = config.accessorySerialFilter || [];
    this.instanceBlacklist = config.instanceDenylist || [];

    if (config.combineSensors) {
      Object.keys(this.types).forEach(type => {
        if (this.types[type] === this.dummy) {
          return;
        }
        this.types[type] = new class extends this.types[type].constructor {
          private primaryService = {};
          private secondaryServices = {};
          private types;
          
          constructor(hap) {
            super(hap);
            this.types = hap.types;
          }

          sync(service) {
            const response = super.sync(service);
            this.secondaryServices[service.uniqueId]?.forEach(secondary => {
              const update = this.types[secondary.type].sync(secondary, response);
              const attribute = {...response.attributes, ...update.attributes};
              response.traits = [...response.traits, ...update.traits];
              if (Object.keys(attribute).length > 0) {
                response.attributes = attribute;
              }
            });
            return response;
          }

          query(service) {
            const response = super.query(service);
            this.secondaryServices[service.uniqueId]?.forEach(secondary => {
              const update = this.types[secondary.type].query(secondary, response);
              Object.assign(response, update);
            });
            return response;
          }

          exec(service, command) {
            return super.exec(service, command);
          }
        }(this);
      });
    
      for (const service of this.sensorServices) {
        this.sensorTypes[service] = this.types[service];
        this.types[service] = this.sensors;
      }
    }

    // eslint-disable-next-line max-len
    this.log.debug(`Waiting ${this.configDiscoveryWait} seconds before starting instance discovery, and ${this.configDiscoveryTimeout} seconds after last device is discovered to publish to Google.`);
    this.startTimeout = setTimeout(() => {
      this.discover();
    }, this.configDiscoveryWait * 1000);

    this.reportStateSubject
      .pipe(
        map((i) => {
          if (!this.pendingStateReport.includes(i)) {
            this.pendingStateReport.push(i);
          }
        }),
        debounceTime(1000),
      )
      .subscribe((data) => {
        const pendingStateReport = this.pendingStateReport;
        this.pendingStateReport = [];
        this.processPendingStateReports(pendingStateReport);
      });
  }

  /**
   * Homebridge Instance Discovery
   */

  async discover() {
    const hapConfig: Config = {
      debug: this.config.debug,
      instanceBlacklist: this.instanceBlacklist,
      discoveryTimeout: this.configDiscoveryTimeout * 1000,
    };

    this.hapClient = new HapClient({
      config: hapConfig,
      pin: this.pin,
      logger: this.log,
    });

    this.waitForNoMoreDiscoveries();
    this.hapClient.on('instance-discovered', this.waitForNoMoreDiscoveries);

    this.hapClient.on('hapEvent', (event) => {
      this.handleHapEvent(event);
    });
  }

  waitForNoMoreDiscoveries = () => {
    // Clear any existing timeout
    if (this.discoveryTimeout) {
      clearTimeout(this.discoveryTimeout);
    }

    // Set up the timeout
    this.discoveryTimeout = setTimeout(() => {
      this.log.debug('No more instances discovered, publishing services');
      this.hapClient.removeListener('instance-discovered', this.waitForNoMoreDiscoveries);
      this.start();
      this.requestSync();
      this.hapClient.on('instance-discovered', this.requestSync.bind(this));  // Request sync on new instance discovery
    }, this.configDiscoveryTimeout * 1000);
  };

  /**
   * Start processing
   */
  async start() {
    this.services = await this.loadAccessories();
    this.log.info(`Discovered ${this.services.length} accessories`);
    this.ready = true;
    await this.buildSyncResponse();
    const evServices: ServiceType[] = this.services.filter(x => this.evTypes.some(uuid => x.serviceCharacteristics.find(c => c.uuid === uuid)));
    this.log.debug(`Monitoring ${evServices.length} services for changes`);

    const monitor = await this.hapClient.monitorCharacteristics(evServices);
    monitor.on('service-update', (services) => {
      // this.log.debug(`Service Update ${services}`);
      services.map((service: any) => {
        this.reportStateSubject.next(service.uniqueId);
      });
      // this.reportStateSubject.next(services[0].uniqueId);
    });
  }

  /**
   * Build Google SYNC intent payload
   */
  async buildSyncResponse(): Promise<SmartHomeV1SyncDevices[]> {
    const devices = this.services.filter((service) =>
      this.types?.[service.type]?.sync,
    ).reduce((response, service) => {
      const update = this.types[service.type].sync(service);
      if (!update) {
        return response;
      }
      const ix = response.findIndex(x => x.id === update.id);
      if (ix > -1) {
        // sensors service might rebuild primary non-sensor service response.
        // console.log('updated sync response.', service.serviceName, update);
        response[ix] = update;
        return response;
      }
      return [...response, update];
    }, []);
    // console.log(devices);
    // console.log(devices.length);
    
    return devices;
  }

  /**
   * Ask google to send a sync request
   */
  async requestSync() {
    if (this.syncTimeout) {
      clearTimeout(this.syncTimeout);
    }
    this.syncTimeout = setTimeout(() => {
      this.log.info('Sending Sync Request');
      this.socket.sendJson({
        type: 'request-sync',
      });
    }, 15000);
  }

  /**
   * Process the QUERY intent
   * @param devices
   */
  async query(devices) {
    // console.log('query', devices);
    const response = {};

    for (const device of devices) {
      const service = this.services.find(x => x.uniqueId === device.id);
      response[device.id] = {};
      if (service) {
        await this.getStatus(service);
        const {id, ...update} = this.types[service.type].query(service);
        if (id) {
          const target = this.services.find(x => x.uniqueId === id);
          this.log.error(`Unexpected query response ${target.serviceName} instead of ${service.serviceName}. ${update}`);
          continue;
        }
        response[device.id] = update;
      }
    }

    return response;
  }

  /**
   * Process the EXECUTE intent
   * @param commands
   */
  async execute(commands: SmartHomeV1ExecuteRequestCommands[]): Promise<SmartHomeV1ExecuteResponseCommands[]> {
    const response: SmartHomeV1ExecuteResponseCommands[] = [];

    for (const command of commands) {
      for (const device of command.devices) {
        const service = this.services.find(x => x.uniqueId === device.id);

        if (service) {
          this.log.debug(`Processing command ${command.execution[0].command} for ${device.id} and ${service.serviceName}`);
          // check if two factor auth is required, and if we have it
          if (this.config.twoFactorAuthPin && this.types[service.type].twoFactorRequired
            && this.types[service.type].is2faRequired(command)
            && !(command.execution.length && command.execution[0].challenge
              && command.execution[0].challenge.pin === this.config.twoFactorAuthPin.toString()
            )
          ) {
            this.log.info('Requesting Two Factor Authentication Pin');
            response.push({
              ids: [device.id],
              status: 'ERROR',
              errorCode: 'challengeNeeded',
              challengeNeeded: {
                type: 'pinNeeded',
              },
            });
          } else {
            // process the request
            try {
              response.push(await this.types[service.type].execute(service, command));
            } catch (error) {
              if (this.config.debug) {
                this.log.debug(`Error executing service: ${JSON.stringify(service)}`);
                this.log.debug(`Error executing command: ${JSON.stringify(command)}`);
                this.log.debug(error);
              }
              this.log.error(`Error executing command: ${error.message}`);
              response.push({
                ids: [device.id],
                status: 'ERROR',
                debugString: error.message,
              });
            }
          }
        } else {
          this.log.error(`Device not found: ${device.id}`);
          // this.log.debug(`Device not found in services list: ${JSON.stringify(this.services)}`);
          response.push({
            ids: [device.id],
            status: 'OFFLINE',
            errorCode: 'deviceNotFound',
          });
        }
      }
    }
    return response;
  }

  /**
   * Request a status update from an accessory
   * @param service
   */
  async getStatus(service: ServiceType) {
    return await service.refreshCharacteristics();
  }

  /**
   * Load all the accessories from Homebridge
   */
  public async loadAccessories(): Promise<ServiceType[]> {
    return this.hapClient.getAllServices().then((services) => {
      if (this.config.debug && process.uptime() < 600) {
        try {
          // write the discovery response to a file for debugging
          const storagePath = this.api.user.storagePath() + '/homebridge-gsh-discovery.json';
          this.log.warn(`Writing Discovery Response to ${storagePath}`);
          fs.writeFileSync(storagePath, JSON.stringify(services, null, 2));
        } catch (e) {
          this.log.error(`Failed to write discovery response to file: ${e.message}`);
        }
      }
      services = services.filter(x => this.types[x.type] !== undefined);
      this.log.debug(`Loaded ${services.length} accessories from Homebridge - pre filter`);
      services = services.filter(x => !this.instanceBlacklist.find(y => y === x?.instance?.username));
      // Pre-compile accessoryFilter strings into RegExp objects
      const compiledAccessoryFilter = this.accessoryFilter.map(filter => new RegExp(filter));
      const searchList = (target: string, regexList: RegExp[]): boolean => {
        if (target) {
          for (const regex of regexList) {
            if (regex.test(target)) {
              this.log.debug(`${this.accessoryFilterInverse ? 'Including' : 'Skipping'} service '${target}' - matches accessoryFilter '${regex}'`);
              return true;
            }
          }
        }
        return false;
      };
      if (this.accessoryFilterInverse) {
        services = services.filter(x => searchList(x.serviceName, compiledAccessoryFilter));
      } else {
        services = services.filter(x => !searchList(x.serviceName, compiledAccessoryFilter));
      }
      services = services.filter(x => !this.accessorySerialFilter.includes(x.accessoryInformation['Serial Number']));
      // if 2fa is forced for this service type, but a pin has not been set ignore the service
      services = services.filter(x => {
        if (this.types[x.type].twoFactorRequired && !this.config.twoFactorAuthPin && !this.config.disablePinCodeRequirement) {
          this.log.warn(`Not registering ${x.serviceName} - Pin code has not been set and is required for secure ` +
            `${x.type} accessory types. See https://git.io/JUQWX`);
          return false;
        } else {
          return true;
        }
      });

      services = services.map(service => {
        return {
          ...service,
          uniqueId: createHash('sha256')
            .update(`${service.instance.username}${service.aid}${service.iid}${service.uuid}`)
            .digest('hex'),
        };
      });      // The embeded uniqueId formula is different with Hap Client
      this.log.debug(`Returned ${services.length} accessories from Homebridge - post filter`);
      return services;
    }).catch((e) => {
      if (e.response?.status === 401) {
        this.log.warn('Homebridge must be running in insecure mode to view and control accessories from this plugin.');
      } else {
        this.log.error(`Failed load accessories from Homebridge: ${e.message}`);
      }
      return [];
    });
  }

  /**
   * Handle events from HAP
   * @param event
   */
  async handleHapEvent(events) {
    for (const event of events) {
      const index = this.services.findIndex(item => item.uniqueId === event.uniqueId);
      if (index === -1) {
        this.log.debug(`[handleHapEvent] Service not found in services list ${event}`);
        return;
      } else {
        this.services[index] = event;
        this.reportStateSubject.next(event.uniqueId);
      }
    }
  }

  /**
   * Generate a state report from the list pending
   * @param pendingStateReport
   */
  async processPendingStateReports(pendingStateReport) {
    const states = {};

    for (const uniqueId of pendingStateReport) {
      const service = this.services.find(x => x.uniqueId === uniqueId);
      if (!this.types?.[service.type]?.query) {
        continue;
      }
      // sensors service might respond as a non-sensor primary service.
      const {id = service.uniqueId, ...response} = this.types[service.type].query(service);
      // response['target'] = this.services.find(x => x.uniqueId === id).serviceName;
      // response['origin'] = service.serviceName;
      // console.log(response);
      states[id] = response;
    }

    return await this.sendStateReport(states);
  }

  async sendFullStateReport() {
    const states = {};

    // don't report state if there are no services
    if (!this.services.length) {
      return;
    }
    this.services.filter((service) =>
      this.types?.[service.type]?.query,
    ).map((service) => {
      // sensors service might respond as a primary non-sensor service.
      const {id = service.uniqueId, ...update} = this.types[service.type].query(service);
      // update['target'] = this.services.find(x => x.uniqueId === id).serviceName;
      // update['origin'] = service.serviceName;
      states[id] = update;
    });
    return await this.sendStateReport(states);
  }

  /**
   * Send the state report back to Google
   * @param states
   * @param requestId
   */
  async sendStateReport(states, requestId?) {
    const payload = {
      requestId,
      type: 'report-state',
      body: states,
    };
    this.log.debug('Sending State Report');
    this.log.debug(JSON.stringify(payload, null, 2));
    this.socket.sendJson(payload);
  }

  /**
   * Close the HAP connection, used for testing
   */
  public async destroy() {
    if (this.startTimeout) {
      clearTimeout(this.startTimeout);
    }
    if (this.discoveryTimeout) {
      clearTimeout(this.discoveryTimeout);
    }
    if (this.syncTimeout) {
      clearTimeout(this.syncTimeout);
    }
    if (this.hapClient) {
      this.hapClient.destroy();
    }
  }
}
