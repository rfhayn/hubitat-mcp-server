# Next Implementation Prompt

**Last Updated**: March 12, 2026
**Status**: M1.2 and M2 complete. Ready for Raspberry Pi production install.

---

## Where We Left Off

M1 (full MCP server) and M2 (performance optimizations) are merged to main. Setup script has deployment guidance and systemd/launchd fixes. Ready for first real Pi install.

## Next Steps: Raspberry Pi Production Install

### Step 1: SSH into the Pi

```bash
ssh pi@<pi-ip>
```

### Step 2: Install Node.js 22

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
node --version  # should show v22.x
```

### Step 3: Clone and Run Setup

```bash
git clone https://github.com/rfhayn/hubitat-mcp-server.git
cd hubitat-mcp-server
bash setup.sh
```

The setup script will:
- Install deps and build
- Ask for Hubitat credentials (hub IP, app ID, token)
- Test the connection
- Configure transport (choose HTTP)
- Set up ngrok (use the same domain as your Mac setup)
- Write `.env`
- Offer to install systemd service (say yes)
- Generate device aliases

### Step 4: Verify the Service

```bash
sudo systemctl status hubitat-mcp
curl http://localhost:3000/health
```

### Step 5: Connect Claude Code on Mac

Run the `claude mcp add` command printed at the end of Pi setup. The ngrok domain is the same one already configured.

## After Pi Install

- Stop the local Mac server (no longer needed)
- Verify Claude.ai and Claude mobile still work via ngrok
- Test the server survives a Pi reboot: `sudo reboot`
- Check logs: `sudo journalctl -u hubitat-mcp -f`

## Future Milestones

- M3: Event streaming (webhooks, EventSocket)
