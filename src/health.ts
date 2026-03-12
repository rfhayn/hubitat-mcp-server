import type { HubitatClient } from './hubitat/client.js';

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  uptime: string;
  hubitat: {
    connected: boolean;
    deviceCount: number;
    lastCheck: string;
  };
  ngrok: {
    connected: boolean;
    url: string | null;
  };
}

const startTime = Date.now();

function formatUptime(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  parts.push(`${minutes}m`);
  return parts.join(' ');
}

export async function getHealthStatus(
  client: HubitatClient,
  tunnelUrl: string | null
): Promise<HealthStatus> {
  const ping = await client.ping();
  const uptime = formatUptime(Date.now() - startTime);

  let status: HealthStatus['status'] = 'healthy';
  if (!ping.connected) status = 'unhealthy';
  else if (tunnelUrl === null && process.env.NGROK_AUTHTOKEN) status = 'degraded';

  return {
    status,
    uptime,
    hubitat: {
      connected: ping.connected,
      deviceCount: ping.deviceCount,
      lastCheck: new Date().toISOString(),
    },
    ngrok: {
      connected: tunnelUrl !== null,
      url: tunnelUrl,
    },
  };
}
