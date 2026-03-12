import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { HubitatClient } from '../hubitat/client.js';

export function registerStatusResources(
  server: McpServer,
  client: HubitatClient
): void {
  server.resource(
    'hub-status',
    'hubitat://status',
    { description: 'Hub mode and HSM status snapshot' },
    async () => {
      const [modes, hsm] = await Promise.all([
        client.getModes(),
        client.getHsmStatus(),
      ]);

      const currentMode = modes.find((m) => m.active);

      const status = {
        mode: currentMode ? currentMode.name : 'unknown',
        hsm: hsm.hsm,
        availableModes: modes.map((m) => ({ id: m.id, name: m.name })),
      };

      return {
        contents: [
          {
            uri: 'hubitat://status',
            mimeType: 'application/json',
            text: JSON.stringify(status, null, 2),
          },
        ],
      };
    }
  );
}
