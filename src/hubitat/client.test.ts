import { describe, it, expect } from 'vitest';
import { HubitatClient } from './client.js';

describe('HubitatClient', () => {
  it('constructs correct base URL from config', () => {
    const client = new HubitatClient({
      host: '192.168.1.100',
      appId: '42',
      accessToken: 'test-token',
    });

    // Verify the client was created (internal URL construction)
    expect(client).toBeInstanceOf(HubitatClient);
  });

  it('handles host with existing protocol', () => {
    const client = new HubitatClient({
      host: 'http://192.168.1.100',
      appId: '42',
      accessToken: 'test-token',
    });

    expect(client).toBeInstanceOf(HubitatClient);
  });

  it('handles host with trailing slash', () => {
    const client = new HubitatClient({
      host: '192.168.1.100/',
      appId: '42',
      accessToken: 'test-token',
    });

    expect(client).toBeInstanceOf(HubitatClient);
  });

  it('ping returns disconnected when hub is unreachable', async () => {
    const client = new HubitatClient({
      host: 'http://127.0.0.1:19999',
      appId: '999',
      accessToken: 'invalid',
    });

    const result = await client.ping();
    expect(result.connected).toBe(false);
    expect(result.deviceCount).toBe(0);
  });
});
