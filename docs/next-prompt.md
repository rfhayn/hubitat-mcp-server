# Next Implementation Prompt

**Last Updated**: March 12, 2026
**Status**: M1.1 code complete, PR #1 open, ready for testing

---

## Where We Left Off

All code is built and compiling on branch `feature/M1.1-project-setup` with PR #1 open. Nothing has been tested against a real Hubitat hub yet.

## Next Steps: Testing & First Run

### Step 1: Set Up Hubitat Maker API (on your hub)

1. Open your Hubitat admin: `http://<your-hub-ip>`
2. Go to **Apps** → **Add Built-in App** → **Maker API**
3. Select ALL devices you want Claude to control
4. Check **"Allow control of modes"**
5. Check **"Allow control of HSM"**
6. Add any hub variables you want to expose
7. Click **Done**
8. On the Maker API app page, note down:
   - **App ID** (number in the URL, e.g., `42`)
   - **Access Token** (long string at bottom of page)

### Step 2: Configure the MCP Server

```bash
cd ~/Development/hubitat
cp .env.example .env
```

Edit `.env` with your real values:
```env
HUBITAT_HOST=<your-hub-ip>        # e.g., 192.168.1.100
HUBITAT_APP_ID=<your-app-id>      # e.g., 42
HUBITAT_ACCESS_TOKEN=<your-token>  # from Maker API page
MCP_TRANSPORT=http
MCP_HTTP_PORT=3000
MCP_AUTH_TOKEN=                     # leave empty for now
```

### Step 3: Test Hub Connectivity

```bash
# Quick curl test to verify Maker API works
curl "http://<hub-ip>/apps/api/<app-id>/devices?access_token=<token>"
# Should return JSON array of your devices
```

### Step 4: Start the Server Locally

```bash
export PATH="/opt/homebrew/opt/node@22/bin:$PATH"
npm start
```

You should see:
```
Hubitat MCP server running on http://localhost:3000
  MCP endpoint: http://localhost:3000/mcp
  Health check: http://localhost:3000/health
```

Test the health endpoint in another terminal:
```bash
curl http://localhost:3000/health
# Should show: connected: true, deviceCount: <number>
```

### Step 5: Connect Claude Code (stdio — simplest first test)

Stop the HTTP server (Ctrl+C), then:

```bash
export PATH="/opt/homebrew/opt/node@22/bin:$PATH"
claude mcp add hubitat --transport stdio -- node ~/Development/hubitat/dist/index.js
```

Then open Claude Code and try:
- "list my hubitat devices"
- "what's the current hub mode?"
- "turn on the kitchen light" (use a real device name)
- "what's the HSM status?"

### Step 6: Test ngrok (when ready for remote access)

1. Sign up at https://dashboard.ngrok.com/signup
2. Copy authtoken from https://dashboard.ngrok.com/authtokens
3. Claim free static domain from https://dashboard.ngrok.com/domains
4. Add to `.env`:
   ```
   NGROK_AUTHTOKEN=<your-token>
   NGROK_DOMAIN=<your-name>.ngrok-free.app
   ```
5. Run `npm start` — tunnel URL prints to console
6. Add to Claude.ai: Settings → Connectors → Add MCP Server → paste URL

### Step 7: Merge PR & Update Docs

Once testing passes:
```bash
# Merge PR #1
gh pr merge 1 --squash

# Update docs
git checkout main && git pull
```

---

## Important Notes

- **Node.js path**: You installed Node 22 via Homebrew. It's at `/opt/homebrew/opt/node@22/bin`. This was added to `~/.zshrc` but you may need to open a new terminal or run `source ~/.zshrc` for it to take effect.
- **PR #1**: https://github.com/rfhayn/hubitat-mcp-server/pull/1
- **Branch**: `feature/M1.1-project-setup`
- All code builds and tests pass (`npm run build && npm test`)

## After Testing Works

- Run `./setup.sh` to test the interactive setup experience
- Test device aliasing (check `devices.json` after setup)
- Test the home context resource in Claude ("read hubitat://home-context")
- Consider deploying to Raspberry Pi
