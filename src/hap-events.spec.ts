import { describe, expect, it, vi } from 'vitest';
import { Hap } from './hap';

// processPendingStateReports only touches `services`, `types` and `sendStateReport`,
// so exercise it against a minimal context instead of a live Homebridge instance.
function makeContext(services: any[]) {
  const dummy = {
    sync: () => undefined,
    query: () => undefined,
    execute: () => undefined,
  };
  return {
    services,
    types: {
      Lightbulb: { query: (service: any) => ({ on: service.on, online: true }) },
      Speaker: dummy,
      InputSource: dummy,
    },
    sendStateReport: vi.fn(async (states: any) => states),
  };
}

function processPendingStateReports(ctx: any, pending: string[]) {
  return Hap.prototype.processPendingStateReports.call(ctx, pending);
}

describe('processPendingStateReports', () => {
  it('skips dummy service types whose query() returns undefined', async () => {
    const ctx = makeContext([
      { uniqueId: 'light', type: 'Lightbulb', on: true },
      { uniqueId: 'speaker', type: 'Speaker' },
      { uniqueId: 'input', type: 'InputSource' },
    ]);

    await expect(processPendingStateReports(ctx, ['speaker', 'light', 'input'])).resolves.toBeDefined();

    expect(ctx.sendStateReport).toHaveBeenCalledTimes(1);
    expect(ctx.sendStateReport).toHaveBeenCalledWith({
      light: { on: true, online: true },
    });
  });

  it('skips unique ids that are no longer in the services list', async () => {
    const ctx = makeContext([
      { uniqueId: 'light', type: 'Lightbulb', on: false },
    ]);

    await expect(processPendingStateReports(ctx, ['removed', 'light'])).resolves.toBeDefined();

    expect(ctx.sendStateReport).toHaveBeenCalledWith({
      light: { on: false, online: true },
    });
  });

  it('sends an empty report when every pending service is skipped', async () => {
    const ctx = makeContext([
      { uniqueId: 'speaker', type: 'Speaker' },
    ]);

    await processPendingStateReports(ctx, ['speaker']);

    expect(ctx.sendStateReport).toHaveBeenCalledWith({});
  });
});

describe('handleServiceUpdate', () => {
  // handleServiceUpdate only touches `types`, `sendNotification` and `reportStateSubject`.
  function makeContext(isPress: boolean) {
    return {
      types: {
        Doorbell: {
          isPress: vi.fn(() => isPress),
          notification: vi.fn((service: any) => ({ [service.uniqueId]: { ObjectDetection: {} } })),
        },
      },
      sendNotification: vi.fn(),
      reportStateSubject: { next: vi.fn() },
    };
  }

  function handleServiceUpdate(ctx: any, services: any[]) {
    return Hap.prototype.handleServiceUpdate.call(ctx, services);
  }

  it('sends a doorbell press as a notification, not a state report', () => {
    const ctx = makeContext(true);

    handleServiceUpdate(ctx, [{ uniqueId: 'doorbell', type: 'Doorbell' }]);

    expect(ctx.sendNotification).toHaveBeenCalledWith({ doorbell: { ObjectDetection: {} } });
    expect(ctx.reportStateSubject.next).not.toHaveBeenCalled();
  });

  it('sends nothing for a doorbell event that is not a press', () => {
    const ctx = makeContext(false);

    handleServiceUpdate(ctx, [{ uniqueId: 'doorbell', type: 'Doorbell' }]);

    expect(ctx.sendNotification).not.toHaveBeenCalled();
    expect(ctx.reportStateSubject.next).not.toHaveBeenCalled();
  });

  it('queues state reports for other service types', () => {
    const ctx = makeContext(true);

    handleServiceUpdate(ctx, [{ uniqueId: 'light', type: 'Lightbulb' }]);

    expect(ctx.reportStateSubject.next).toHaveBeenCalledWith('light');
    expect(ctx.sendNotification).not.toHaveBeenCalled();
  });
});
