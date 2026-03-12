# M2: MCP Performance Optimizations

**Status:** ACTIVE
**Created:** 2026-03-12

## Context

The current server makes one HTTP request per device query. "What doors are open?" generates 15 `get_device` calls. Adding a device cache, bulk query tools, batch commands, and retry logic will reduce this to 1 API call (or 0 if cached). Targeting Raspberry Pi deployment.

## Files Modified

| File | Change |
|------|--------|
| `src/hubitat/types.ts` | Add `room` field to device types |
| `src/hubitat/cache.ts` | **New** — DeviceCache class with TTL |
| `src/hubitat/client.ts` | Integrate cache, add retry logic to `request()` |
| `src/tools/devices.ts` | Add 3 new tools: `get_devices_by_capability`, `get_devices_by_room`, `send_commands_batch` |
| `src/resources/context.ts` | Include room in device listings |

## Implementation Details

### 1. `room` field on types (`types.ts`)

Added `room?: string` to `HubitatDevice` and `HubitatDeviceSummary`. The Maker API returns room data (confirmed during M1.1 testing) but it was not previously typed.

### 2. DeviceCache (`cache.ts` — new file)

Simple in-memory cache for the `getAllDevices()` response:
- Single cached array of `HubitatDevice[]`
- 30-second default TTL (configurable)
- `get()` / `set()` / `invalidate()` methods
- No per-device caching, no LRU, no persistence — keeps memory bounded on Pi

### 3. Cache + retry in HubitatClient (`client.ts`)

**Cache integration:**
- `getAllDevices()`: return from cache if valid, otherwise fetch + cache
- `getDevice(id)`: look up from cached `getAllDevices()` result, fall back to direct API if not found
- `sendCommand()`: call `cache.invalidate()` after success (device state changed)

**Retry logic in `request()`:**
- 2 retries with exponential backoff (1s, 2s, cap at 5s)
- Only retry on network errors (`TypeError`) or 5xx responses
- Do not retry 4xx (bad input)

### 4. Bulk query tools (`tools/devices.ts`)

**`get_devices_by_capability`** — the highest-impact optimization:
- Params: `capability: string`, `attribute?: string`
- Calls `client.getAllDevices()` (1 API call, cached)
- Filters by capability (case-insensitive)
- If `attribute` specified, returns compact `{ id, label, room, [attribute]: value }`
- Tool description lists common capabilities so Claude knows what to ask for

**`get_devices_by_room`**:
- Params: `room: string`
- Filters `getAllDevices()` by room (case-insensitive)
- Returns devices with key attributes

**`send_commands_batch`**:
- Params: `commands: Array<{ deviceId, command, value? }>`
- Executes all commands in parallel via `Promise.allSettled`
- Returns per-device success/error results
- One failure doesn't block others

### 5. Context resource (`resources/context.ts`)

Include room in device state lines: `"Kitchen Light" (id: 51) [Kitchen] — on`

## What This Does NOT Include
- No event-driven cache invalidation (M3 — EventSocket/webhooks)
- No persistent cache or Redis
- No new npm dependencies

## Verification

```bash
npm run build && npm test
```

Live test: start server, ask Claude "what doors are open?" — should see single `get_devices_by_capability` call instead of 15 `get_device` calls.
