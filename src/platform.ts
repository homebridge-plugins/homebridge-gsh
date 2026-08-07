/**
 * Homebridge Entry Point
 */

import fs from 'fs-extra';
import type { API } from 'homebridge';
import path from 'node:path';
import { PluginConfig } from './interfaces.js';

export class HomebridgeGoogleSmartHome {
  constructor(
    public log,
    public config: PluginConfig,
    public api: API,
  ) {
    if (this.config.token) {
      this.start();
    }
  }

  async start() {
    const { Plugin } = await import('./main.js');
    const homebridgeConfig = await fs.readJson(
      path.resolve(this.api.user.configPath()),
    );

    return new Plugin(this.log, this.config, homebridgeConfig, this.api);
  }
}