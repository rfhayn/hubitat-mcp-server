#!/usr/bin/env bash
set -euo pipefail

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
BOLD='\033[1m'
NC='\033[0m'

print_step() { echo -e "${GREEN}✓${NC} $1"; }
print_warn() { echo -e "${YELLOW}!${NC} $1"; }
print_error() { echo -e "${RED}✗${NC} $1"; }
print_prompt() { echo -en "${BLUE}?${NC} $1"; }
print_header() { echo -e "\n${BOLD}$1${NC}"; }

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

echo ""
echo "═══════════════════════════════════════════════════"
echo "  Hubitat MCP Server — Setup"
echo "═══════════════════════════════════════════════════"
echo ""

# ─── Deployment Guidance ──────────────────────────────
print_header "Before we start"
echo ""
echo "  The MCP server needs to run 24/7 for Claude to control"
echo "  your home from anywhere (phone, web, desktop)."
echo ""
echo "  ${GREEN}Best: Raspberry Pi, Mac mini, NAS, or always-on Linux box${NC}"
echo "  ${YELLOW}OK for testing: A laptop that may sleep or close${NC}"
echo ""

if [[ "$(uname)" == "Darwin" ]]; then
    print_prompt "Does this Mac stay on 24/7? [y/N]: "
    read -r MAC_ALWAYS_ON
    if [[ ! "$MAC_ALWAYS_ON" =~ ^[Yy]$ ]]; then
        echo ""
        print_warn "For always-on access, run this setup on a Raspberry Pi"
        echo "    or other device that stays on. SSH in and run:"
        echo "      git clone https://github.com/rfhayn/hubitat-mcp-server.git"
        echo "      cd hubitat-mcp-server && bash setup.sh"
        echo ""
        print_prompt "Continue setup on this Mac anyway? [y/N]: "
        read -r CONTINUE_MAC
        if [[ ! "$CONTINUE_MAC" =~ ^[Yy]$ ]]; then
            exit 0
        fi
        echo ""
    fi
fi

# ─── Check Node.js ────────────────────────────────────
if ! command -v node &>/dev/null; then
    print_error "Node.js not found. Install Node.js 20+ first:"
    echo "  brew install node@22    (macOS)"
    echo "  sudo apt install nodejs (Linux)"
    exit 1
fi

NODE_VERSION=$(node --version | sed 's/v//' | cut -d. -f1)
if [ "$NODE_VERSION" -lt 20 ]; then
    print_error "Node.js $NODE_VERSION found, but 20+ required."
    exit 1
fi
print_step "Node.js $(node --version)"

# ─── Install & Build ─────────────────────────────────
if [ ! -d "node_modules" ]; then
    echo ""
    print_header "Installing dependencies..."
    npm install --silent
fi
print_step "Dependencies installed"

if [ ! -d "dist" ]; then
    echo ""
    print_header "Building..."
    npm run build --silent
fi
print_step "TypeScript compiled"

mkdir -p "${SCRIPT_DIR}/logs"

# ─── Hubitat Configuration ───────────────────────────
print_header "Hubitat Maker API Configuration"
echo ""
echo "  You'll need your Maker API credentials from Hubitat."
echo ""
echo "  If you haven't set up Maker API yet:"
echo "    1. Open http://<hub-ip> → Apps → Add Built-in App → Maker API"
echo "    2. Under 'Allow Endpoint to Control These Devices', click Select Devices"
echo "    3. Toggle ON 'Allow control of modes' and 'Allow control of HSM'"
echo "    4. Click Done"
echo ""
echo "  If Maker API is already installed:"
echo "    Open http://<hub-ip> → Apps → Maker API"
echo ""
echo "  To find your credentials, scroll to the 'Local URLs' section:"
echo "    App ID    — the number after /apps/api/ in any endpoint URL"
echo "    Token     — the value after access_token= in any endpoint URL"
echo ""

print_prompt "Hubitat hub IP address: "
read -r HUBITAT_HOST

print_prompt "Maker API App ID: "
read -r HUBITAT_APP_ID

print_prompt "Maker API Access Token: "
read -rs HUBITAT_ACCESS_TOKEN
echo ""

# ─── Test Hubitat Connection ─────────────────────────
echo ""
echo "Testing connection to Hubitat..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
    "http://${HUBITAT_HOST}/apps/api/${HUBITAT_APP_ID}/devices?access_token=${HUBITAT_ACCESS_TOKEN}" \
    --connect-timeout 5 2>/dev/null || echo "000")

if [ "$HTTP_CODE" = "200" ]; then
    DEVICE_COUNT=$(curl -s \
        "http://${HUBITAT_HOST}/apps/api/${HUBITAT_APP_ID}/devices?access_token=${HUBITAT_ACCESS_TOKEN}" \
        --connect-timeout 5 2>/dev/null | python3 -c "import sys,json; print(len(json.load(sys.stdin)))" 2>/dev/null || echo "?")
    print_step "Connected to Hubitat — found ${DEVICE_COUNT} devices"
else
    print_warn "Could not connect to Hubitat (HTTP ${HTTP_CODE}). Check your credentials."
    print_prompt "Continue anyway? [y/N]: "
    read -r CONTINUE
    if [[ ! "$CONTINUE" =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# ─── Transport ────────────────────────────────────────
print_header "Transport Configuration"
echo ""
echo "  stdio  — Local only (Claude Code CLI launches the server)"
echo "  http   — Remote access (Claude mobile, web, desktop)"
echo ""
print_prompt "Transport [http]: "
read -r MCP_TRANSPORT
MCP_TRANSPORT=${MCP_TRANSPORT:-http}

MCP_HTTP_PORT="3000"
MCP_AUTH_TOKEN=""

if [ "$MCP_TRANSPORT" = "http" ]; then
    print_prompt "HTTP port [3000]: "
    read -r PORT_INPUT
    MCP_HTTP_PORT=${PORT_INPUT:-3000}

    # Generate random auth token
    MCP_AUTH_TOKEN=$(openssl rand -hex 32)
    print_step "Generated auth token for HTTP transport"
fi

# ─── ngrok Configuration ─────────────────────────────
NGROK_AUTHTOKEN=""
NGROK_DOMAIN=""

if [ "$MCP_TRANSPORT" = "http" ]; then
    print_header "ngrok Configuration (Remote Access)"
    echo ""
    echo "  ngrok provides a free public URL so Claude can reach your server"
    echo "  from anywhere (mobile, web, desktop)."
    echo ""
    print_prompt "Set up ngrok for remote access? [Y/n]: "
    read -r SETUP_NGROK
    SETUP_NGROK=${SETUP_NGROK:-Y}

    if [[ "$SETUP_NGROK" =~ ^[Yy]$ ]]; then
        echo ""
        echo "  If you don't have an ngrok account yet:"
        echo "    1. Sign up (free tier) at: https://dashboard.ngrok.com/signup"
        echo "       - Complete the onboarding survey (any answers are fine)"
        echo "       - The free plan includes 1 static domain — that's all you need"
        echo "    2. Copy your authtoken from: https://dashboard.ngrok.com/get-started/your-authtoken"
        echo "       (NOT the 'Authtokens' page under Universal Gateway — that shows a different token)"
        echo ""
        print_prompt "ngrok authtoken: "
        read -rs NGROK_AUTHTOKEN
        echo ""

        echo ""
        echo "    3. Claim a free static domain at: https://dashboard.ngrok.com/domains"
        echo "       (e.g., your-name.ngrok-free.app)"
        echo ""
        print_prompt "ngrok static domain (or press Enter to skip): "
        read -r NGROK_DOMAIN

        if [ -n "$NGROK_AUTHTOKEN" ]; then
            print_step "ngrok configured"
        fi
    fi
fi

# ─── Write .env ──────────────────────────────────────
cat > .env << ENVEOF
# Hubitat Connection
HUBITAT_HOST=${HUBITAT_HOST}
HUBITAT_APP_ID=${HUBITAT_APP_ID}
HUBITAT_ACCESS_TOKEN=${HUBITAT_ACCESS_TOKEN}

# MCP Server
MCP_TRANSPORT=${MCP_TRANSPORT}
MCP_HTTP_PORT=${MCP_HTTP_PORT}
MCP_AUTH_TOKEN=${MCP_AUTH_TOKEN}

# ngrok
NGROK_AUTHTOKEN=${NGROK_AUTHTOKEN}
NGROK_DOMAIN=${NGROK_DOMAIN}
ENVEOF

print_step ".env configured"

# ─── System Service ──────────────────────────────────
if [ "$MCP_TRANSPORT" = "http" ]; then
    print_header "System Service (Auto-Start)"
    echo ""

    if [[ "$(uname)" == "Darwin" ]]; then
        print_prompt "Install as macOS launchd service? [y/N]: "
        read -r INSTALL_SERVICE
        if [[ "$INSTALL_SERVICE" =~ ^[Yy]$ ]]; then
            NODE_PATH=$(which node)
            sed "s|__PROJECT_DIR__|${SCRIPT_DIR}|g; s|__NODE_PATH__|${NODE_PATH}|g" \
                com.hubitat-mcp.plist.template > com.hubitat-mcp.plist 2>/dev/null || true
            if [ -f "com.hubitat-mcp.plist" ]; then
                cp com.hubitat-mcp.plist ~/Library/LaunchAgents/
                launchctl load ~/Library/LaunchAgents/com.hubitat-mcp.plist 2>/dev/null || true
                print_step "Launchd service installed"
            else
                print_warn "Launchd template not found. Start manually with: npm start"
            fi
        fi
    elif [[ "$(uname)" == "Linux" ]]; then
        print_prompt "Install as systemd service? [Y/n]: "
        read -r INSTALL_SERVICE
        INSTALL_SERVICE=${INSTALL_SERVICE:-Y}
        if [[ "$INSTALL_SERVICE" =~ ^[Yy]$ ]]; then
            NODE_PATH=$(which node)
            sed "s|__PROJECT_DIR__|${SCRIPT_DIR}|g; s|__NODE_PATH__|${NODE_PATH}|g; s|__USER__|$(whoami)|g" \
                hubitat-mcp.service.template > /tmp/hubitat-mcp.service
            sudo cp /tmp/hubitat-mcp.service /etc/systemd/system/hubitat-mcp.service
            sudo systemctl daemon-reload
            sudo systemctl enable hubitat-mcp
            sudo systemctl start hubitat-mcp
            print_step "Systemd service installed and started"
        fi
    fi
fi

# ─── Generate Device Aliases ─────────────────────────
if [ "$HTTP_CODE" = "200" ]; then
    echo ""
    print_header "Generating device aliases..."
    node -e "
        import('dotenv/config');
        import('./dist/hubitat/client.js').then(async ({ HubitatClient }) => {
            const { generateAliases, saveAliases } = await import('./dist/aliases.js');
            const client = new HubitatClient({
                host: process.env.HUBITAT_HOST,
                appId: process.env.HUBITAT_APP_ID,
                accessToken: process.env.HUBITAT_ACCESS_TOKEN,
            });
            const aliases = await generateAliases(client);
            await saveAliases(aliases);
            console.log('Generated aliases for ' + Object.keys(aliases).length + ' devices');
        });
    " 2>/dev/null && print_step "Device aliases generated (edit devices.json to customize)" \
      || print_warn "Could not generate aliases. You can create devices.json manually."
fi

# ─── Print Claude Configuration ──────────────────────
echo ""
echo "═══════════════════════════════════════════════════"
echo "  Setup Complete!"
echo "═══════════════════════════════════════════════════"
echo ""

if [ "$MCP_TRANSPORT" = "stdio" ]; then
    echo "  ── Claude Code (CLI) ──────────────────────────"
    echo "  Run:"
    echo "    claude mcp add hubitat --transport stdio -- node ${SCRIPT_DIR}/dist/index.js"
    echo ""
elif [ "$MCP_TRANSPORT" = "http" ]; then
    if [ -n "$NGROK_DOMAIN" ]; then
        MCP_URL="https://${NGROK_DOMAIN}/mcp"
    else
        MCP_URL="http://localhost:${MCP_HTTP_PORT}/mcp"
    fi

    echo "  MCP URL: ${MCP_URL}"
    echo ""
    echo "  ── Claude Code (CLI) ──────────────────────────"
    echo "  Run:"
    if [ -n "$MCP_AUTH_TOKEN" ]; then
        echo "    claude mcp add hubitat --transport http ${MCP_URL} --header \"Authorization: Bearer ${MCP_AUTH_TOKEN}\""
    else
        echo "    claude mcp add hubitat --transport http ${MCP_URL}"
    fi
    echo ""
    echo "  ── Claude Desktop ─────────────────────────────"
    echo "  Add to claude_desktop_config.json:"
    echo ""
    echo "    {"
    echo "      \"mcpServers\": {"
    echo "        \"hubitat\": {"
    echo "          \"type\": \"url\","
    echo "          \"url\": \"${MCP_URL}\""
    if [ -n "$MCP_AUTH_TOKEN" ]; then
        echo "          ,\"headers\": { \"Authorization\": \"Bearer ${MCP_AUTH_TOKEN}\" }"
    fi
    echo "        }"
    echo "      }"
    echo "    }"
    echo ""
    echo "  ── Claude.ai (Web) ────────────────────────────"
    echo "  Go to claude.ai → Settings → Connectors → Add MCP Server"
    echo "  Paste: ${MCP_URL}"
    echo ""

    # Offer to auto-configure Claude Code
    if command -v claude &>/dev/null; then
        echo ""
        print_prompt "Auto-configure Claude Code now? [Y/n]: "
        read -r AUTO_CONFIGURE
        AUTO_CONFIGURE=${AUTO_CONFIGURE:-Y}
        if [[ "$AUTO_CONFIGURE" =~ ^[Yy]$ ]]; then
            if [ -n "$MCP_AUTH_TOKEN" ]; then
                claude mcp add hubitat --transport http "${MCP_URL}" \
                    --header "Authorization: Bearer ${MCP_AUTH_TOKEN}" 2>/dev/null \
                    && print_step "Claude Code configured" \
                    || print_warn "Auto-configure failed. Run the command above manually."
            else
                claude mcp add hubitat --transport http "${MCP_URL}" 2>/dev/null \
                    && print_step "Claude Code configured" \
                    || print_warn "Auto-configure failed. Run the command above manually."
            fi
        fi
    fi
fi

echo ""
echo "  Start the server:"
echo "    npm start"
echo ""
echo "═══════════════════════════════════════════════════"
