# Introduction

This plugin controls [WiZ](https://www.wizconnected.com/) lights from
[OpenBridge](https://github.com/nubisco/openbridge), talking to each bulb
directly over your own network. There is no cloud service in the path and no
WiZ account involved.

## Why not just use homebridge-wiz-lan?

That plugin is good, and this one exists despite that rather than because of
any defect in it. The difference is how bulbs are found.

WiZ's discovery is a UDP broadcast to `255.255.255.255:38899`. Every bulb on
the network hears it and answers. That works on a plain wired LAN, and it works
on most single-access-point Wi-Fi.

It stops working on a mesh. Broadcast frames have to be transmitted at the
lowest data rate every client can decode, cannot be acknowledged or retried the
way unicast can, and on a mesh they are repeated across every radio and every
backhaul link. So consumer mesh vendors drop or rate-limit them. TP-Link Deco
does exactly this: it will forward a unicast datagram to port 38899 and get a
reply in milliseconds, while every broadcast sent to the same port vanishes.

The consequence is one-way. A bulb that stops answering gets marked offline,
and bringing it back requires rediscovery, which is the broadcast that never
arrives. Give five bulbs DHCP reservations and all five change address at once,
and every one of them becomes permanently invisible. Nothing in the plugin is
at fault, and nothing in the plugin can recover from it.

This plugin takes each bulb's address from configuration. There is nothing to
discover, so there is nothing to lose.

## What else is different

**Names are applied on every start.** Rename a bulb in configuration, restart,
and it is renamed. Plugins that apply the configured name only when creating an
accessory never rename one restored from cache, so a bulb can carry a name you
changed months ago.

**"Not answering" is kept distinct from "off".** An unreachable bulb keeps its
last known reading, because that is still useful, but it reports
`reachable: false` and answers HomeKit reads with a communication failure. The
tile greys out instead of showing a plausible value. Collapsing those two facts
is how a bulb that has been off the network for an hour ends up looking like
one somebody switched off.

**State changes are pushed.** A light switched at the wall, in the WiZ app, or
by a schedule is picked up on the next poll and pushed to HomeKit, rather than
sitting stale until something happens to read the characteristic.

## What it does not do

- **No scenes or effects.** WiZ's built-in light effects are readable but not
  settable here.
- **No discovery, by design.** If you want a list of what is on your network,
  see [Finding your bulbs](/finding-bulbs).
- **No standalone HAP bridge.** It publishes through OpenBridge's bridge, so
  there is one pairing rather than two.

## Next

- [Installation](/installation)
- [Finding your bulbs](/finding-bulbs)
- [Configuration](/configuration)
