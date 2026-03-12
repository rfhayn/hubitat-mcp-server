import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { HubitatClient } from '../hubitat/client.js';

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
}
