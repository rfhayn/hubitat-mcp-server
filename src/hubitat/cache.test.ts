import { describe, it, expect, vi, afterEach } from 'vitest';
import { DeviceCache } from './cache.js';
import type { HubitatDevice } from './types.js';

const mockDevice: HubitatDevice = {
  id: '1',
  name: 'Test Switch',
  label: 'Test Switch',
  type: 'Generic Switch',
  room: 'Kitchen',
  capabilities: ['Switch'],
  attributes: [{ name: 'switch', currentValue: 'on', dataType: 'STRING' }],
  commands: [{ command: 'on', type: [] }, { command: 'off', type: [] }],
};

describe('DeviceCache', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns null when empty', () => {
    const cache = new DeviceCache();
    expect(cache.get()).toBeNull();
  });

  it('returns cached devices within TTL', () => {
    const cache = new DeviceCache(5000);
    cache.set([mockDevice]);
    expect(cache.get()).toEqual([mockDevice]);
  });

  it('returns null after TTL expires', () => {
    const cache = new DeviceCache(100);
    cache.set([mockDevice]);

    // Advance time past TTL
    vi.spyOn(Date, 'now').mockReturnValue(Date.now() + 200);
    expect(cache.get()).toBeNull();
  });

  it('returns null after invalidation', () => {
    const cache = new DeviceCache(5000);
    cache.set([mockDevice]);
    cache.invalidate();
    expect(cache.get()).toBeNull();
  });

  it('uses default TTL of 30 seconds', () => {
    const cache = new DeviceCache();
    const now = Date.now();
    vi.spyOn(Date, 'now').mockReturnValue(now);

    cache.set([mockDevice]);

    // Still valid at 29s
    vi.spyOn(Date, 'now').mockReturnValue(now + 29_000);
    expect(cache.get()).not.toBeNull();

    // Expired at 31s
    vi.spyOn(Date, 'now').mockReturnValue(now + 31_000);
    expect(cache.get()).toBeNull();
  });
});
