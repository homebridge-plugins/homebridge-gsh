import { Component, OnDestroy, OnInit } from '@angular/core';
import { JwtHelperService } from '@auth0/angular-jwt';

import { PluginConfig, PluginSchema, ServerEnvMetadata } from '@homebridge/plugin-ui-utils/dist/ui.interface';
import { SERVER_ADDRESS } from '../../../../src/settings';

import { TranslateService } from './translate.service';
import { UserDataService } from './user-data.service';

const jwtHelper = new JwtHelperService();

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit, OnDestroy {
  private linkDomain: string;
  private linkUrl: string;
  private popup: Window;
  private originCheckInterval;

  public pluginConfig: PluginConfig;
  public schema: PluginSchema;
  public env: ServerEnvMetadata['env'] = window.homebridge.serverEnv.env;

  public linkType: string;
  public user_id: string;
  public justLinked = false;

  public ready = false;
  public userData: any;

  constructor(
    public translateService: TranslateService,
    private userDataService: UserDataService,
  ) { }

  async ngOnInit(): Promise<void> {
    this.schema = await window.homebridge.getPluginConfigSchema();
    const configBlocks = await window.homebridge.getPluginConfig();

    if (!configBlocks.length) {
      this.pluginConfig = {
        name: 'Google Smart Home',
        platform: this.schema.pluginAlias,
      };
    } else {
      this.pluginConfig = configBlocks[0];
      window.homebridge.showSchemaForm();
    }

    this.linkDomain = this.pluginConfig.betaServer
      ? `https://${SERVER_ADDRESS.beta}`
      : `https://${SERVER_ADDRESS.prod}`;
    this.linkUrl = this.linkDomain + '/link-account';

    this.parseToken();
    this.ready = true;

    window.homebridge.addEventListener('configChanged', (event: MessageEvent) => {
      this.pluginConfig = event.data[0];
    });
  }

  async updateConfig() {
    return window.homebridge.updatePluginConfig([this.pluginConfig]);
  }

  linkAccount() {
    window.addEventListener('message', this.windowMessageListener, false);

    const w = 450;
    const h = 700;
    const y = window.top.outerHeight / 2 + window.top.screenY - (h / 2);
    const x = window.top.outerWidth / 2 + window.top.screenX - (w / 2);
    this.popup = window.open(
      this.linkUrl,
      'oznu-google-smart-home-auth',
      `toolbar=no, location=no, directories=no, status=no, menubar=no scrollbars=no, resizable=no, copyhistory=no, width=${w}, height=${h}, top=${y}, left=${x}`
    );

    this.originCheckInterval = setInterval(() => {
      this.popup.postMessage('origin-check', this.linkDomain);
    }, 2000);
  }

  async processToken(token: string) {
    clearInterval(this.originCheckInterval);
    if (this.popup) {
      this.popup.close();
    }

    this.pluginConfig.token = token;
    this.pluginConfig.notice = 'Keep your token a secret!';

    this.parseToken();
    this.justLinked = true;
    await this.updateConfig();
    await window.homebridge.savePluginConfig();
    window.homebridge.showSchemaForm();
  }

  parseToken() {
    if (this.pluginConfig.token) {
      try {
        const decoded = jwtHelper.decodeToken(this.pluginConfig.token);
        this.linkType = decoded.id.split('|')[0].split('-')[0];
        this.user_id = decoded.id;
      } catch (e) {
        window.homebridge.toast.error(
          'Invalid account linking token in config.json',
          this.translateService.translations['toast.title_error']
        );
        delete this.pluginConfig.token;
      }
    }
  }

  windowMessageListener = (e: MessageEvent) => {
    if (e.origin !== this.linkDomain) return;

    try {
      const data = JSON.parse(e.data);
      if (data.token) {
        this.processToken(data.token);
      } else {
        console.log('Received message from popup:', data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  onUserDataChange(userData: any) {
    this.userData = userData;
  }

  ngOnDestroy() {
    clearInterval(this.originCheckInterval);
    window.removeEventListener('message', this.windowMessageListener);
    if (this.popup) {
      this.popup.close();
    }
  }

  copyToClipboard(input: string): void {
    navigator.clipboard.writeText(input).then(
      () => {
        window.homebridge.toast.success(`Copied ${input} to clipboard`);
      },
      (err) => {
        console.error('❌ Failed to copy:', err);
        window.homebridge.toast.error('Error', 'Failed to copy');
      }
    );
  }
}