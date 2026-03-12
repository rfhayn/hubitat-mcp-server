// Built-in ngrok tunnel — starts automatically when NGROK_AUTHTOKEN is set

export interface TunnelInfo {
  url: string;
}

export async function startTunnel(port: number): Promise<TunnelInfo | null> {
  const authtoken = process.env.NGROK_AUTHTOKEN;
  if (!authtoken) {
    return null;
  }

  // Dynamic import so ngrok is only loaded when configured
  const ngrok = await import('@ngrok/ngrok');

  const listener = await ngrok.default.forward({
    addr: port,
    authtoken,
    domain: process.env.NGROK_DOMAIN || undefined,
  });

  const url = listener.url();
  if (!url) {
    throw new Error('ngrok tunnel started but no URL returned');
  }

  return { url };
}
