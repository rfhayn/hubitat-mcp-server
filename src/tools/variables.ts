import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { HubitatClient } from '../hubitat/client.js';

export function registerVariableTools(
  server: McpServer,
  client: HubitatClient
): void {
  server.tool(
    'get_variable',
    'Get the current value of a hub variable',
    {
      name: z.string().describe('The variable name'),
    },
    async ({ name }) => {
      const variable = await client.getVariable(name);
      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(variable, null, 2),
          },
        ],
      };
    }
  );

  server.tool(
    'set_variable',
    'Set the value of a hub variable',
    {
      name: z.string().describe('The variable name'),
      value: z.string().describe('The new value to set'),
    },
    async ({ name, value }) => {
      const variable = await client.setVariable(name, value);
      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(variable, null, 2),
          },
        ],
      };
    }
  );
}
