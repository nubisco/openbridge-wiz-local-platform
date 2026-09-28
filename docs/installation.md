# Installation

## From the OpenBridge UI

Open **Plugins**, search the marketplace for `wiz`, and install
`@nubisco/openbridge-wiz-local-platform`. Configure it before enabling: with no
devices declared the plugin starts, warns, and does nothing, because it has
nothing to talk to.

## From the command line

```sh
npm install -g @nubisco/openbridge-wiz-local-platform
```

Then add it to `~/.openbridge/config.json` under `plugins`, and restart
OpenBridge.

## Requirements

- OpenBridge, any version that supports native platform plugins
- Node 20 or newer
- The bridge host and the bulbs on the same subnet, with UDP port 38899
  reachable between them

Bulbs do not need to answer ICMP. Many WiZ bulbs ignore ping entirely, so a
failed `ping` says nothing useful. The test that matters is
[a unicast getPilot](/finding-bulbs).

## Give every bulb a fixed address

This plugin addresses bulbs by IP, so those addresses must not move. Add a DHCP
reservation for each bulb on whatever serves DHCP on your network.

Two things worth getting right:

**Put reservations outside the dynamic pool.** A reservation inside the pool
invites a collision with a lease already handed to something else.

**Change the configuration at the same time.** A reservation takes effect at the
bulb's next lease renewal, which can be hours away. Until then the bulb is still
at its old address, so plan for the plugin to report it as not responding for a
while, or restart the bulb to force a renewal.

## Next

- [Finding your bulbs](/finding-bulbs)
- [Configuration](/configuration)
