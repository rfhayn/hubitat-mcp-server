import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { HubitatClient } from './hubitat/client.js';
import { registerDeviceTools } from './tools/devices.js';
import { registerModeTools } from './tools/modes.js';
import { registerHsmTools } from './tools/hsm.js';
import { registerVariableTools } from './tools/variables.js';
import { registerDeviceResources } from './resources/devices.js';
import { registerStatusResources } from './resources/status.js';
import type { HubitatConfig } from './hubitat/types.js';

export function createServer(config: HubitatConfig): {
  server: McpServer;
  client: HubitatClient;
} {
  const client = new HubitatClient(config);

  const server = new McpServer({
    name: 'hubitat-mcp-server',
    version: '0.1.0',
  });

  // Register all tools
  registerDeviceTools(server, client);
  registerModeTools(server, client);
  registerHsmTools(server, client);
  registerVariableTools(server, client);

  // Register all resources
  registerDeviceResources(server, client);
  registerStatusResources(server, client);

  return { server, client };
}
