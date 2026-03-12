import { readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { HubitatClient } from './hubitat/client.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ALIASES_PATH = join(__dirname, '..', 'devices.json');

export interface DeviceAliases {
  [deviceId: string]: string[];
}

export async function loadAliases(): Promise<DeviceAliases> {
  if (!existsSync(ALIASES_PATH)) {
    return {};
  }

  const raw = await readFile(ALIASES_PATH, 'utf-8');
  const parsed = JSON.parse(raw) as { aliases?: DeviceAliases };
  return parsed.aliases ?? {};
}

export async function saveAliases(aliases: DeviceAliases): Promise<void> {
  await writeFile(ALIASES_PATH, JSON.stringify({ aliases }, null, 2) + '\n', 'utf-8');
}

export function resolveAlias(
  nameOrId: string,
  aliases: DeviceAliases
): string | null {
  // Direct ID match
  if (aliases[nameOrId] !== undefined) {
    return nameOrId;
  }

  // Search aliases (case-insensitive)
  const lower = nameOrId.toLowerCase();
  for (const [deviceId, names] of Object.entries(aliases)) {
    if (names.some((n) => n.toLowerCase() === lower)) {
      return deviceId;
    }
  }

  return null;
}

// Generate initial aliases from Hubitat device labels
export async function generateAliases(
  client: HubitatClient
): Promise<DeviceAliases> {
  const devices = await client.listDevices();
  const aliases: DeviceAliases = {};

  for (const device of devices) {
    const names: string[] = [];

    // Use label as primary alias
    if (device.label) {
      names.push(device.label.toLowerCase());
    }

    // Add device name if different from label
    if (device.name && device.name.toLowerCase() !== device.label?.toLowerCase()) {
      names.push(device.name.toLowerCase());
    }

    if (names.length > 0) {
      aliases[device.id] = names;
    }
  }

  return aliases;
}
