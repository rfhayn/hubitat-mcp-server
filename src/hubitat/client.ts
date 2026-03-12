import type {
  HubitatConfig,
  HubitatDevice,
  HubitatDeviceSummary,
  HubitatEvent,
  HubitatHsmStatus,
  HubitatMode,
  HubitatVariable,
} from './types.js';

export class HubitatClient {
  private readonly baseUrl: string;
  private readonly accessToken: string;

  constructor(config: HubitatConfig) {
    const host = config.host.replace(/\/$/, '');
    const protocol = host.startsWith('http') ? '' : 'http://';
    this.baseUrl = `${protocol}${host}/apps/api/${config.appId}`;
    this.accessToken = config.accessToken;
  }

  private async request<T>(path: string): Promise<T> {
    const separator = path.includes('?') ? '&' : '?';
    const url = `${this.baseUrl}${path}${separator}access_token=${this.accessToken}`;

    const response = await fetch(url);

    if (!response.ok) {
      const body = await response.text().catch(() => 'unknown');
      throw new Error(
        `Hubitat API error: ${response.status} ${response.statusText} — ${body}`
      );
    }

    return response.json() as Promise<T>;
  }

  // Device endpoints

  async listDevices(): Promise<HubitatDeviceSummary[]> {
    return this.request<HubitatDeviceSummary[]>('/devices');
  }

  async getAllDevices(): Promise<HubitatDevice[]> {
    return this.request<HubitatDevice[]>('/devices/all');
  }

  async getDevice(deviceId: string): Promise<HubitatDevice> {
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
    return this.request<unknown>(path);
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
