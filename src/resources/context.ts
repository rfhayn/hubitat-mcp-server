import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { HubitatClient } from '../hubitat/client.js';
import type { HubitatDevice } from '../hubitat/types.js';

// Group devices by capability for readable context
function categorizeDevice(device: HubitatDevice): string {
  const caps = device.capabilities.map((c) => c.toLowerCase());

  if (caps.includes('thermostat') || caps.includes('thermostatoperatingstate')) return 'Thermostats';
  if (caps.includes('lock')) return 'Locks';
  if (caps.includes('garagedoorcontrol')) return 'Garage Doors';
  if (caps.includes('motionsensor')) return 'Motion Sensors';
  if (caps.includes('contactsensor')) return 'Contact Sensors';
  if (caps.includes('temperaturesensor') || caps.includes('temperaturemeasurement')) return 'Temperature Sensors';
  if (caps.includes('humiditysensor') || caps.includes('relativehumiditymeasurement')) return 'Humidity Sensors';
  if (caps.includes('presencesensor')) return 'Presence Sensors';
  if (caps.includes('smokedetector') || caps.includes('carbonmonoxidedetector')) return 'Safety Sensors';
  if (caps.includes('waterdetector') || caps.includes('watersensor')) return 'Water Sensors';
  if (caps.includes('windowshade') || caps.includes('windowblind')) return 'Shades & Blinds';
  if (caps.includes('colorbulb') || caps.includes('colorcontrol') || caps.includes('colortemperature')) return 'Color Lights';
  if (caps.includes('switchlevel') || caps.includes('dimmer')) return 'Dimmable Lights';
  if (caps.includes('switch') || caps.includes('light')) return 'Switches & Lights';
  if (caps.includes('button') || caps.includes('pushablebutton')) return 'Buttons & Remotes';
  if (caps.includes('powermonitor') || caps.includes('energymeter') || caps.includes('powermeter')) return 'Energy Monitors';
  if (caps.includes('valve')) return 'Valves';
  if (caps.includes('fan') || caps.includes('fancontrol')) return 'Fans';

  return 'Other Devices';
}

function getAttributeValue(device: HubitatDevice, name: string): string | null {
  const attr = device.attributes.find((a) => a.name === name);
  if (attr === undefined || attr.currentValue === null || attr.currentValue === undefined) {
    return null;
  }
  return String(attr.currentValue);
}

function formatDeviceState(device: HubitatDevice): string {
  const parts: string[] = [];

  const switchState = getAttributeValue(device, 'switch');
  if (switchState) parts.push(switchState);

  const level = getAttributeValue(device, 'level');
  if (level && switchState === 'on') parts.push(`${level}%`);

  const lock = getAttributeValue(device, 'lock');
  if (lock) parts.push(lock);

  const contact = getAttributeValue(device, 'contact');
  if (contact) parts.push(contact);

  const motion = getAttributeValue(device, 'motion');
  if (motion) parts.push(motion);

  const temperature = getAttributeValue(device, 'temperature');
  if (temperature) parts.push(`${temperature}°F`);

  const thermostatMode = getAttributeValue(device, 'thermostatMode');
  if (thermostatMode) parts.push(thermostatMode);

  const heatingSetpoint = getAttributeValue(device, 'heatingSetpoint');
  if (heatingSetpoint) parts.push(`setpoint: ${heatingSetpoint}°F`);

  const presence = getAttributeValue(device, 'presence');
  if (presence) parts.push(presence);

  const battery = getAttributeValue(device, 'battery');
  if (battery) parts.push(`battery: ${battery}%`);

  return parts.length > 0 ? parts.join(', ') : 'no state';
}

export async function generateHomeContext(client: HubitatClient): Promise<string> {
  const [devices, modes, hsm] = await Promise.all([
    client.getAllDevices(),
    client.getModes(),
    client.getHsmStatus(),
  ]);

  const currentMode = modes.find((m) => m.active);

  // Group by category
  const groups: Record<string, HubitatDevice[]> = {};
  for (const device of devices) {
    const category = categorizeDevice(device);
    if (!groups[category]) groups[category] = [];
    groups[category].push(device);
  }

  // Build context string
  const lines: string[] = [];
  lines.push(`You are connected to a Hubitat home automation hub with ${devices.length} devices.`);
  lines.push('');
  lines.push(`Hub Mode: ${currentMode ? currentMode.name : 'unknown'}`);
  lines.push(`HSM Status: ${hsm.hsm}`);
  lines.push('');

  // Sort categories for consistent output
  const sortedCategories = Object.keys(groups).sort();
  for (const category of sortedCategories) {
    const categoryDevices = groups[category];
    lines.push(`${category}:`);
    for (const device of categoryDevices) {
      const state = formatDeviceState(device);
      lines.push(`  - "${device.label || device.name}" (id: ${device.id}) — ${state}`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

export function registerContextResources(
  server: McpServer,
  client: HubitatClient
): void {
  server.resource(
    'home-context',
    'hubitat://home-context',
    { description: 'Auto-generated summary of all devices grouped by type with current state. Use this to understand the home layout.' },
    async () => {
      const context = await generateHomeContext(client);
      return {
        contents: [
          {
            uri: 'hubitat://home-context',
            mimeType: 'text/plain',
            text: context,
          },
        ],
      };
    }
  );
}
