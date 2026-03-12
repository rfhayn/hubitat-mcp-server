import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { HubitatClient } from '../hubitat/client.js';

export function registerModeTools(
  server: McpServer,
  client: HubitatClient
): void {
  server.tool(
    'get_modes',
    'List all available hub modes and which one is currently active',
    {},
    async () => {
      const modes = await client.getModes();
      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(modes, null, 2),
          },
        ],
      };
    }
  );

  server.tool(
    'get_current_mode',
    'Get the currently active hub mode',
    {},
    async () => {
      const mode = await client.getCurrentMode();
      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(mode, null, 2),
          },
        ],
      };
    }
  );

  server.tool(
    'set_mode',
    'Change the hub mode (e.g., Home, Away, Night)',
    {
      modeId: z.string().describe('The mode ID to switch to'),
    },
    async ({ modeId }) => {
      const result = await client.setMode(modeId);
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
}
