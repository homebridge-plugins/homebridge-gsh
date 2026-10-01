import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Hap } from './hap';

// Exercise the discovery retry / late-reload logic against a minimal context
// instead of a live Homebridge instance.
function makeContext(services: any[] = []) {
  const ctx: any = {
    services,
    discoveryRetries: 0,
    discoveryRetryInterval: 30,
    maxDiscoveryRetries: 10,
    configDiscoveryTimeout: 5,
    hapClient: { resetInstancePool: vi.fn() },
    log: { warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
    start: vi.fn(async () => undefined),
    requestSync: vi.fn(),
  };
  ctx.scheduleDiscoveryRetry = Hap.prototype.scheduleDiscoveryRetry.bind(ctx);
  ctx.reloadAccessories = Hap.prototype.reloadAccessories.bind(ctx);
  return ctx;
}

describe('discovery retry', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('restarts instance discovery while no accessories have been found', () => {
    const ctx = makeContext();

    ctx.scheduleDiscoveryRetry();
    expect(ctx.hapClient.resetInstancePool).not.toHaveBeenCalled();

    vi.advanceTimersByTime(30_000);
    expect(ctx.hapClient.resetInstancePool).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(30_000);
    expect(ctx.hapClient.resetInstancePool).toHaveBeenCalledTimes(2);
  });

  it('stops retrying once accessories have been loaded', () => {
    const ctx = makeContext();

    ctx.scheduleDiscoveryRetry();
    vi.advanceTimersByTime(30_000);
    expect(ctx.hapClient.resetInstancePool).toHaveBeenCalledTimes(1);

    ctx.services.push({ uniqueId: 'tv', type: 'Television' });
    vi.advanceTimersByTime(30_000 * 5);
    expect(ctx.hapClient.resetInstancePool).toHaveBeenCalledTimes(1);
  });

  it('gives up after the maximum number of retries', () => {
    const ctx = makeContext();

    ctx.scheduleDiscoveryRetry();
    vi.advanceTimersByTime(30_000 * 20);

    expect(ctx.hapClient.resetInstancePool).toHaveBeenCalledTimes(10);
    expect(ctx.log.warn).toHaveBeenLastCalledWith(expect.stringContaining('giving up'));
  });

  it('does not retry when accessories were found on the first pass', () => {
    const ctx = makeContext([{ uniqueId: 'tv', type: 'Television' }]);

    ctx.scheduleDiscoveryRetry();
    vi.advanceTimersByTime(30_000 * 20);

    expect(ctx.hapClient.resetInstancePool).not.toHaveBeenCalled();
    expect(ctx.log.warn).not.toHaveBeenCalled();
  });
});

describe('late instance discovery', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('reloads accessories (not just requests a sync) when an instance registers late', async () => {
    const ctx = makeContext();

    // several instances registering back to back are debounced into one reload
    ctx.reloadAccessories();
    ctx.reloadAccessories();
    ctx.reloadAccessories();
    expect(ctx.start).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(5_000);

    expect(ctx.start).toHaveBeenCalledTimes(1);
    expect(ctx.requestSync).toHaveBeenCalledTimes(1);
  });

  describe('start()', () => {
    it('closes the previous characteristic monitor when re-run', async () => {
      const monitors: any[] = [];
      const ctx: any = {
        log: { info: vi.fn(), debug: vi.fn() },
        evTypes: [],
        loadAccessories: vi.fn(async () => []),
        buildSyncResponse: vi.fn(async () => undefined),
        reportStateSubject: { next: vi.fn() },
        hapClient: {
          monitorCharacteristics: vi.fn(async () => {
            const m = { on: vi.fn(), finish: vi.fn(), removeAllListeners: vi.fn() };
            monitors.push(m);
            return m;
          }),
        },
      };
      const start = Hap.prototype.start.bind(ctx);

      await start();
      await start();

      expect(monitors).toHaveLength(2);
      expect(monitors[0].finish).toHaveBeenCalledTimes(1);
      expect(monitors[0].removeAllListeners).toHaveBeenCalledTimes(1);
      expect(monitors[1].finish).not.toHaveBeenCalled();
    });
  });
});
