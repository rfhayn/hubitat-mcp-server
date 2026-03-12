import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { HubitatClient } from '../hubitat/client.js';

const HSM_COMMANDS = [
  'armAway',
  'armHome',
  'armNight',
  'disarm',
  'disarmAll',
  'armRules',
  'disarmRules',
  'cancelAlerts',
] as const;

export function registerHsmTools(
  server: McpServer,
  client: HubitatClient
): void {
  server.tool(
    'get_hsm_status',
    'Get the current Hubitat Safety Monitor (HSM) status (armed/disarmed state)',
    {},
    async () => {
      const status = await client.getHsmStatus();
      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(status, null, 2),
          },
        ],
      };
    }
  );

  server.tool(
    'set_hsm',
    `Set the Hubitat Safety Monitor state. Valid commands: ${HSM_COMMANDS.join(', ')}`,
    {
      command: z
        .enum(HSM_COMMANDS)
        .describe('The HSM command (armAway, armHome, armNight, disarm, disarmAll, cancelAlerts)'),
    },
    async ({ command }) => {
      const result = await client.setHsm(command);
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
