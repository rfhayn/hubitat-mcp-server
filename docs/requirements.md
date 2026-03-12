# Requirements

**Last Updated**: March 12, 2026

## Functional Requirements

### Core
- [ ] Connect to Hubitat Maker API (local or cloud)
- [ ] List all devices with current state
- [ ] Control basic devices (switches, dimmers, locks)
- [ ] Query device attributes and capabilities
- [ ] Error handling with clear messages to Claude

### Extended
- [ ] Control advanced devices (thermostats, color bulbs, shades)
- [ ] Access and trigger rules/automations
- [ ] Hub info and diagnostics
- [ ] Device event history
- [ ] Scene activation

### Non-Functional
- [ ] TypeScript strict mode
- [ ] Comprehensive test coverage
- [ ] Sub-second response for device commands
- [ ] Graceful handling of hub unreachable
- [ ] Secure API token storage (never in code)
