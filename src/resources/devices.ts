import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { HubitatClient } from '../hubitat/client.js';

export function registerDeviceResources(
  server: McpServer,
  client: HubitatClient
): void {
  server.resource(
    'devices-list',
    'hubitat://devices',
    { description: 'All authorized Hubitat devices with current state' },
    async () => {
      const devices = await client.getAllDevices();
      return {
        contents: [
          {
            uri: 'hubitat://devices',
            mimeType: 'application/json',
            text: JSON.stringify(devices, null, 2),
          },
        ],
      };
    }
  );
}
