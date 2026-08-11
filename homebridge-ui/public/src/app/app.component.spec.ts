import { TestBed } from '@angular/core/testing';
import { MockHomebridgePluginUi } from '@homebridge/plugin-ui-utils/dist/ui.mock';
import flushPromises from 'flush-promises';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AppComponent } from './app.component';

describe('appComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should request the plugin config', async () => {
    // setup mocks
    window.homebridge = new MockHomebridgePluginUi();
    vi.spyOn(window.homebridge, 'getPluginConfig');

    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();

    await flushPromises();

    expect(window.homebridge.getPluginConfig).toHaveBeenCalled();
  });
});
