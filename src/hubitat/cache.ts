import type { HubitatDevice } from './types.js';

const DEFAULT_TTL_MS = 30_000;

export class DeviceCache {
  private devices: HubitatDevice[] | null = null;
  private expiresAt = 0;
  private readonly ttlMs: number;

  constructor(ttlMs: number = DEFAULT_TTL_MS) {
    this.ttlMs = ttlMs;
  }

  get(): HubitatDevice[] | null {
    if (this.devices === null || Date.now() >= this.expiresAt) {
      return null;
    }
    return this.devices;
  }

  set(devices: HubitatDevice[]): void {
    this.devices = devices;
    this.expiresAt = Date.now() + this.ttlMs;
  }

  invalidate(): void {
    this.devices = null;
    this.expiresAt = 0;
  }
}
