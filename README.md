# @nubisco/openbridge-wiz-local-platform

Controls WiZ lights locally over UDP, for [OpenBridge](https://github.com/nubisco/openbridge).

No cloud, no account, and **no broadcast discovery**.

## Why this exists

WiZ's own discovery is a UDP broadcast to `255.255.255.255:38899`. Consumer mesh
access points routinely drop broadcast frames to save airtime, and a TP-Link Deco
mesh does exactly that: it forwards unicast to that port perfectly well while
swallowing every broadcast sent to it.

On such a network a discovery-based plugin cannot recover a bulb that changes
address. Give the bulbs DHCP reservations, and every one of them disappears the
moment the new lease takes effect, with no way back short of restoring the old
addresses.

This plugin takes each bulb's address from configuration, so there is nothing to
discover and nothing to lose. It also fixes three smaller things that cost real
debugging time:

- **Names come from config on every start.** Rename a bulb, restart, and it is
  renamed. Plugins that apply the configured name only when first creating an
  accessory never rename one restored from cache.
- **"Not answering" is not the same as "off".** A bulb that has dropped off the
  network keeps its last known reading, but reports `reachable: false` and
  answers HomeKit reads with a communication failure, so the tile greys out
  instead of showing a plausible lie.
- **State changes are pushed, not waited for.** A light switched at the wall or
  in the WiZ app reaches HomeKit on the next poll rather than the next time
  something happens to read the characteristic.

## Configuration

```json
{
  "name": "@nubisco/openbridge-wiz-local-platform",
  "enabled": true,
  "config": {
    "pollIntervalSeconds": 30,
    "failuresBeforeOffline": 3,
    "devices": [
      { "name": "Fireplace Top", "mac": "d8a011bcba97", "host": "192.168.1.155", "kind": "rgbtw" },
      { "name": "Fireplace Middle", "mac": "d8a01145dc70", "host": "192.168.1.152", "kind": "rgbtw" },
      { "name": "Fireplace Bottom", "mac": "d8a011bc31cd", "host": "192.168.1.153", "kind": "rgbtw" },
      { "name": "Coffee Table", "mac": "d8a01145da5c", "host": "192.168.1.151", "kind": "rgbtw" },
      { "name": "Piano", "mac": "d8a011bcc1f7", "host": "192.168.1.154", "kind": "rgbtw" }
    ]
  }
}
```

| Field                           | Default        | Meaning                                                   |
| ------------------------------- | -------------- | --------------------------------------------------------- |
| `devices[].name`                | required       | What the bulb is called in HomeKit and OpenBridge         |
| `devices[].mac`                 | required       | As the bulb reports it. Case and separators are ignored   |
| `devices[].host`                | required       | The bulb's address. Give it a DHCP reservation            |
| `devices[].kind`                | `rgbtw`        | `rgbtw`, `tw`, `dimmable` or `socket`                     |
| `devices[].pollIntervalSeconds` | platform value | Per-bulb override                                         |
| `pollIntervalSeconds`           | `30`           | How often each bulb is probed                             |
| `failuresBeforeOffline`         | `3`            | Consecutive missed probes before reporting not responding |
| `requestTimeoutMs`              | `4000`         | How long to wait for one reply                            |

`kind` is declared rather than probed on purpose. A probe only sees the channels
in the bulb's current pilot, so a colour bulb sitting in white mode looks like a
tunable-white one and would silently lose its colour controls.

### Finding a bulb's MAC and address

```sh
echo -n '{"method":"getPilot","params":{}}' | nc -u -w 2 192.168.1.154 38899
```

A reply names the `mac`, and confirms the bulb answers unicast on that address.

## Behaviour worth knowing

**Brightness has no zero.** WiZ treats off as `state: false` and will not accept
a `dimming` below 10. Setting brightness to 0 in HomeKit turns the bulb off, and
an off bulb reports 0% rather than the 10% it would otherwise return.

**Writes are read back.** A bulb clamps values it dislikes, so after every write
the plugin re-reads and reports what the bulb accepted, not what was asked for.

**A successful write counts as reachability.** Pressing a button recovers a bulb
that had been marked offline, rather than making you wait out the poll interval.

**Requests to the same bulb are coalesced.** Five characteristics read at once
put one datagram on the wire, not five. These radios are the weakest link on the
network and do not need the extra traffic.

## Development

```sh
npm install
npm test
npm run build
npm run quality:check
```

## Licence

MIT
