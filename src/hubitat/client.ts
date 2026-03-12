import type {
  HubitatConfig,
  HubitatDevice,
  HubitatDeviceSummary,
  HubitatEvent,
  HubitatHsmStatus,
  HubitatMode,
  HubitatVariable,
} from './types.js';
import { DeviceCache } from './cache.js';

const MAX_RETRIES = 2;
const BACKOFF_BASE_MS = 1000;
const BACKOFF_CAP_MS = 5000;

function isRetryable(error: unknown): boolean {
  // Network errors (fetch throws TypeError for connection failures)
  if (error instanceof TypeError) return true;

  // 5xx errors surfaced as our Error with status in the message
  if (error instanceof Error && /Hubitat API error: 5\d\d/.test(error.message)) {
    return true;
  }

  return false;
}

export class HubitatClient {
  private readonly baseUrl: string;
  private readonly accessToken: string;
  private readonly cache: DeviceCache;

  constructor(config: HubitatConfig, cacheTtlMs?: number) {
    const host = config.host.replace(/\/$/, '');
    const protocol = host.startsWith('http') ? '' : 'http://';
    this.baseUrl = `${protocol}${host}/apps/api/${config.appId}`;
    this.accessToken = config.accessToken;
    this.cache = new DeviceCache(cacheTtlMs);
  }

  private async request<T>(path: string): Promise<T> {
    const separator = path.includes('?') ? '&' : '?';
    const url = `${this.baseUrl}${path}${separator}access_token=${this.accessToken}`;

    let lastError: unknown;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      if (attempt > 0) {
        const delayMs = Math.min(BACKOFF_BASE_MS * attempt, BACKOFF_CAP_MS);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }

      try {
        const response = await fetch(url);

        if (!response.ok) {
          const body = await response.text().catch(() => 'unknown');
          const error = new Error(
            `Hubitat API error: ${response.status} ${response.statusText} — ${body}`
          );

          // Only retry on 5xx, not 4xx
          if (response.status >= 500 && attempt < MAX_RETRIES) {
            lastError = error;
            continue;
          }

          throw error;
        }

        return response.json() as Promise<T>;
      } catch (error) {
        lastError = error;

        if (attempt < MAX_RETRIES && isRetryable(error)) {
          continue;
        }

        throw error;
      }
    }

    // Should not reach here, but satisfies TypeScript
    throw lastError;
  }

  // Device endpoints

  async listDevices(): Promise<HubitatDeviceSummary[]> {
    return this.request<HubitatDeviceSummary[]>('/devices');
  }

  async getAllDevices(): Promise<HubitatDevice[]> {
    const cached = this.cache.get();
    if (cached !== null) {
      return cached;
    }

    const devices = await this.request<HubitatDevice[]>('/devices/all');
    this.cache.set(devices);
    return devices;
  }

  async getDevice(deviceId: string): Promise<HubitatDevice> {
    // Try to serve from the all-devices cache first
    const cached = this.cache.get();
    if (cached !== null) {
      const device = cached.find((d) => d.id === deviceId);
      if (device) return device;
    }

    return this.request<HubitatDevice>(`/devices/${deviceId}`);
  }

  async getDeviceEvents(deviceId: string): Promise<HubitatEvent[]> {
    return this.request<HubitatEvent[]>(`/devices/${deviceId}/events`);
  }

  async sendCommand(
    deviceId: string,
    command: string,
    secondaryValue?: string
  ): Promise<unknown> {
    const path = secondaryValue
      ? `/devices/${deviceId}/${command}/${secondaryValue}`
      : `/devices/${deviceId}/${command}`;
    const result = await this.request<unknown>(path);
    // Invalidate cache — device state has changed
    this.cache.invalidate();
    return result;
  }

  // Mode endpoints

  async getModes(): Promise<HubitatMode[]> {
    return this.request<HubitatMode[]>('/modes');
  }

  async getCurrentMode(): Promise<HubitatMode> {
    const modes = await this.getModes();
    const active = modes.find((m) => m.active);
    if (!active) {
      throw new Error('No active mode found');
    }
    return active;
  }

  async setMode(modeId: string): Promise<unknown> {
    return this.request<unknown>(`/modes/${modeId}`);
  }

  // HSM endpoints

  async getHsmStatus(): Promise<HubitatHsmStatus> {
    return this.request<HubitatHsmStatus>('/hsm');
  }

  async setHsm(command: string): Promise<unknown> {
    return this.request<unknown>(`/hsm/${command}`);
  }

  // Variable endpoints

  async getVariable(name: string): Promise<HubitatVariable> {
    return this.request<HubitatVariable>(`/hubvariables/${name}`);
  }

  async setVariable(name: string, value: string): Promise<HubitatVariable> {
    return this.request<HubitatVariable>(`/hubvariables/${name}/${value}`);
  }

  // Health check — verify connectivity

  async ping(): Promise<{ connected: boolean; deviceCount: number }> {
    try {
      const devices = await this.listDevices();
      return { connected: true, deviceCount: devices.length };
    } catch {
      return { connected: false, deviceCount: 0 };
    }
  }
}
