import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { HubitatClient } from '../hubitat/client.js';
import type { HubitatDevice } from '../hubitat/types.js';

function getAttributeValue(device: HubitatDevice, name: string): unknown {
  const attr = device.attributes.find((a) => a.name === name);
  return attr?.currentValue ?? null;
}

export function registerDeviceTools(
  server: McpServer,
  client: HubitatClient
): void {
  server.tool(
    'list_devices',
    'List all authorized Hubitat devices with their names and types',
    {},
    async () => {
      const devices = await client.listDevices();
      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(devices, null, 2),
          },
        ],
      };
    }
  );

  server.tool(
    'get_device',
    'Get detailed info for a device including current attributes, capabilities, and available commands',
    {
      deviceId: z.string().describe('The device ID'),
    },
    async ({ deviceId }) => {
      const device = await client.getDevice(deviceId);
      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(device, null, 2),
          },
        ],
      };
    }
  );

  server.tool(
    'send_command',
    'Send a command to a device (e.g., on, off, setLevel, lock, unlock, setColor)',
    {
      deviceId: z.string().describe('The device ID'),
      command: z.string().describe('The command to send (e.g., on, off, setLevel, lock, unlock)'),
      value: z
        .string()
        .optional()
        .describe('Optional value for the command (e.g., level 0-100, color hex)'),
    },
    async ({ deviceId, command, value }) => {
      const result = await client.sendCommand(deviceId, command, value);
      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    }
  );

  server.tool(
    'get_device_events',
    'Get recent event history for a device (state changes, commands)',
    {
      deviceId: z.string().describe('The device ID'),
    },
    async ({ deviceId }) => {
      const events = await client.getDeviceEvents(deviceId);
      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(events, null, 2),
          },
        ],
      };
    }
  );

  server.tool(
    'get_devices_by_capability',
    `Query all devices with a specific capability. Returns matching devices from cache (single API call). ` +
    `Common capabilities: Switch, SwitchLevel, ContactSensor, MotionSensor, TemperatureMeasurement, ` +
    `Lock, GarageDoorControl, Thermostat, PresenceSensor, ColorControl, WaterSensor, Valve, FanControl, ` +
    `WindowShade, Button, EnergyMeter, PowerMeter, RelativeHumidityMeasurement, Battery`,
    {
      capability: z.string().describe('Capability name (case-insensitive), e.g. "ContactSensor", "Switch", "Lock"'),
      attribute: z
        .string()
        .optional()
        .describe('If specified, return compact results with only this attribute value (e.g., "contact", "switch", "lock")'),
    },
    async ({ capability, attribute }) => {
      const devices = await client.getAllDevices();
      const capLower = capability.toLowerCase();
      const matching = devices.filter((d) =>
        d.capabilities.some((c) => c.toLowerCase() === capLower)
      );

      let result: unknown;
      if (attribute) {
        result = matching.map((d) => ({
          id: d.id,
          label: d.label || d.name,
          room: d.room ?? null,
          [attribute]: getAttributeValue(d, attribute),
        }));
      } else {
        result = matching;
      }

      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    }
  );

  server.tool(
    'get_devices_by_room',
    'Get all devices in a specific room with their key attributes',
    {
      room: z.string().describe('Room name (case-insensitive)'),
    },
    async ({ room }) => {
      const devices = await client.getAllDevices();
      const roomLower = room.toLowerCase();
      const matching = devices.filter(
        (d) => d.room?.toLowerCase() === roomLower
      );

      const result = matching.map((d) => {
        const attrs: Record<string, unknown> = {};
        for (const attr of d.attributes) {
          if (attr.currentValue !== null && attr.currentValue !== undefined) {
            attrs[attr.name] = attr.currentValue;
          }
        }
        return {
          id: d.id,
          label: d.label || d.name,
          type: d.type,
          capabilities: d.capabilities,
          attributes: attrs,
        };
      });

      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    }
  );

  server.tool(
    'send_commands_batch',
    'Send commands to multiple devices in parallel. One failure does not block others.',
    {
      commands: z.array(
        z.object({
          deviceId: z.string().describe('The device ID'),
          command: z.string().describe('The command to send'),
          value: z.string().optional().describe('Optional command value'),
        })
      ).describe('Array of commands to execute in parallel'),
    },
    async ({ commands }) => {
      const results = await Promise.allSettled(
        commands.map((cmd) =>
          client.sendCommand(cmd.deviceId, cmd.command, cmd.value)
        )
      );

      const response = commands.map((cmd, i) => {
        const result = results[i];
        if (result.status === 'fulfilled') {
          return { deviceId: cmd.deviceId, command: cmd.command, success: true };
        }
        return {
          deviceId: cmd.deviceId,
          command: cmd.command,
          success: false,
          error: result.reason instanceof Error ? result.reason.message : String(result.reason),
        };
      });

      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(response, null, 2),
          },
        ],
      };
    }
  );
}
