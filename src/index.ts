import 'dotenv/config';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { createServer } from './server.js';
import { startTunnel } from './tunnel.js';
import { getHealthStatus } from './health.js';
import type { HubitatConfig } from './hubitat/types.js';
import http from 'node:http';

function getConfig(): HubitatConfig {
  const host = process.env.HUBITAT_HOST;
  const appId = process.env.HUBITAT_APP_ID;
  const accessToken = process.env.HUBITAT_ACCESS_TOKEN;

  if (!host || !appId || !accessToken) {
    console.error(
      'Missing required environment variables: HUBITAT_HOST, HUBITAT_APP_ID, HUBITAT_ACCESS_TOKEN'
    );
    console.error('Copy .env.example to .env and fill in your Hubitat Maker API credentials.');
    process.exit(1);
  }

  return { host, appId, accessToken };
}

async function startStdio(): Promise<void> {
  const config = getConfig();
  const { server } = createServer(config);
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Hubitat MCP server running on stdio');
}

async function startHttp(): Promise<void> {
  const config = getConfig();
  const { client } = createServer(config);
  const port = parseInt(process.env.MCP_HTTP_PORT || '3000', 10);
  const authToken = process.env.MCP_AUTH_TOKEN;

  let tunnelUrl: string | null = null;

  const httpServer = http.createServer(async (req, res) => {
    // Health endpoint
    if (req.url === '/health') {
      const status = await getHealthStatus(client, tunnelUrl);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(status, null, 2));
      return;
    }

    // Auth check for MCP endpoints
    if (authToken && req.url?.startsWith('/mcp')) {
      const authorization = req.headers.authorization;
      if (authorization !== `Bearer ${authToken}`) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Unauthorized' }));
        return;
      }
    }

    // MCP endpoint — stateless: new server+transport per request
    if (req.url === '/mcp' || req.url?.startsWith('/mcp')) {
      const { server: reqServer } = createServer(config);
      const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
      await reqServer.connect(transport);
      await transport.handleRequest(req, res);
      res.on('close', () => {
        transport.close();
        reqServer.close();
      });
      return;
    }

    // Root — basic info
    if (req.url === '/') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        name: 'hubitat-mcp-server',
        version: '0.1.0',
        mcp: '/mcp',
        health: '/health',
      }));
      return;
    }

    res.writeHead(404);
    res.end('Not found');
  });

  httpServer.listen(port, () => {
    console.log(`Hubitat MCP server running on http://localhost:${port}`);
    console.log(`  MCP endpoint: http://localhost:${port}/mcp`);
    console.log(`  Health check: http://localhost:${port}/health`);
  });

  // Start ngrok tunnel if configured
  const tunnel = await startTunnel(port);
  if (tunnel) {
    tunnelUrl = tunnel.url;
    console.log(`\nngrok tunnel active: ${tunnel.url}`);
    console.log(`\nAdd this MCP server to Claude:`);
    console.log(`  URL: ${tunnel.url}/mcp`);
  }
}

// CLI flag --stdio or --http overrides MCP_TRANSPORT env var
const cliTransport = process.argv.includes('--stdio') ? 'stdio'
  : process.argv.includes('--http') ? 'http'
  : undefined;
const transport = cliTransport || process.env.MCP_TRANSPORT || 'stdio';

if (transport === 'stdio') {
  startStdio().catch((err) => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
} else if (transport === 'http') {
  startHttp().catch((err) => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
} else {
  console.error(`Unknown transport: ${transport}. Use "stdio" or "http".`);
  process.exit(1);
}
