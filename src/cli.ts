#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');

const command = process.argv[2] || 'start';

switch (command) {
  case 'start':
    console.log('Starting Hubitat MCP server...');
    await import('./index.js');
    break;

  case 'setup': {
    const setupScript = join(projectRoot, 'setup.sh');
    if (!existsSync(setupScript)) {
      console.error('setup.sh not found. Run from the project directory.');
      process.exit(1);
    }
    execFileSync('bash', [setupScript], { stdio: 'inherit', cwd: projectRoot });
    break;
  }

  case 'status': {
    if (!existsSync(join(projectRoot, '.env'))) {
      console.error('Not configured. Run: hubitat-mcp setup');
      process.exit(1);
    }
    const dotenv = await import('dotenv');
    dotenv.config({ path: join(projectRoot, '.env') });

    const { HubitatClient } = await import('./hubitat/client.js');
    const host = process.env.HUBITAT_HOST;
    const appId = process.env.HUBITAT_APP_ID;
    const accessToken = process.env.HUBITAT_ACCESS_TOKEN;

    if (!host || !appId || !accessToken) {
      console.error('Missing Hubitat credentials in .env');
      process.exit(1);
    }

    const client = new HubitatClient({ host, appId, accessToken });
    const ping = await client.ping();

    console.log(`Hubitat connection: ${ping.connected ? 'connected' : 'disconnected'}`);
    if (ping.connected) {
      console.log(`Devices found: ${ping.deviceCount}`);
    }
    console.log(`Transport: ${process.env.MCP_TRANSPORT || 'stdio'}`);
    console.log(`ngrok: ${process.env.NGROK_AUTHTOKEN ? 'configured' : 'not configured'}`);
    break;
  }

  case 'update':
    console.log('Updating hubitat-mcp-server...');
    try {
      execFileSync('git', ['pull', 'origin', 'main'], { stdio: 'inherit', cwd: projectRoot });
      execFileSync('npm', ['install'], { stdio: 'inherit', cwd: projectRoot });
      execFileSync('npm', ['run', 'build'], { stdio: 'inherit', cwd: projectRoot });
      console.log('\nUpdate complete. Restart the server to apply changes.');
    } catch {
      console.error('Update failed. Try manually: git pull && npm install && npm run build');
      process.exit(1);
    }
    break;

  case 'help':
    console.log(`
hubitat-mcp — MCP server for Hubitat Elevation

Commands:
  setup    Interactive setup (credentials, ngrok, service install)
  start    Start the MCP server (default)
  status   Check hub connectivity and configuration
  update   Pull latest code, rebuild
  help     Show this help message
`);
    break;

  default:
    console.error(`Unknown command: ${command}. Run: hubitat-mcp help`);
    process.exit(1);
}
