# Credits

## Standing on other people's work

**[homebridge-wiz-lan](https://github.com/9constellations/homebridge-wiz-lan)** by
9constellations and its contributors. This plugin exists because WiZ's broadcast
discovery cannot work on a mesh that drops broadcast frames, which is a property
of the network rather than a defect in that plugin. Its handling of the protocol
is careful work: per-device offline tracking, coalesced probes, and write
generations that stop a delayed reply rolling back a fresh write. Several
behaviours documented here were learned by reading it.

Accessory UUIDs are generated the same way it generates them, deliberately, so
that swapping one for the other keeps every bulb's HomeKit room, scenes and
automations.

**The WiZ protocol** has no public specification. What is implemented here comes
from the community's reverse engineering, chiefly
[pywizlight](https://github.com/sbidy/pywizlight), and from asking real bulbs
what they do.

**[OpenBridge](https://github.com/nubisco/openbridge)** provides the HAP bridge,
the device model and the plugin host.

**[hap-nodejs](https://github.com/homebridge/HAP-NodeJS)** implements the HomeKit
Accessory Protocol underneath all of it.

## Sponsorship

This is MIT licensed and free. If it is useful,
[sponsorship](https://github.com/sponsors/joseporto) helps keep it maintained:
device integrations need hardware to test against, and hardware costs money.
