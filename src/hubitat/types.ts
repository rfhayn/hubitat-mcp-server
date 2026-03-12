// Hubitat Maker API response types

export interface HubitatDevice {
  id: string;
  name: string;
  label: string;
  type: string;
  model?: string;
  manufacturer?: string;
  capabilities: string[];
  attributes: HubitatAttribute[];
  commands: HubitatCommand[];
}

export interface HubitatDeviceSummary {
  id: string;
  name: string;
  label: string;
  type: string;
}

export interface HubitatAttribute {
  name: string;
  currentValue: unknown;
  dataType: string;
}

export interface HubitatCommand {
  command: string;
  type: string[];
}

export interface HubitatEvent {
  device_id: string;
  label: string;
  name: string;
  value: string;
  displayName: string;
  unit: string | null;
  descriptionText: string;
  date: string;
}

export interface HubitatMode {
  id: string;
  name: string;
  active: boolean;
}

export interface HubitatHsmStatus {
  hsm: string;
}

export interface HubitatVariable {
  name: string;
  value: string;
  type: string;
}

export interface HubitatConfig {
  host: string;
  appId: string;
  accessToken: string;
}
