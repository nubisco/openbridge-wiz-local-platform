# Configuration

```json
{
  "name": "@nubisco/openbridge-wiz-local-platform",
  "enabled": true,
  "config": {
    "pollIntervalSeconds": 30,
    "failuresBeforeOffline": 3,
    "requestTimeoutMs": 4000,
    "devices": [{ "name": "Piano", "mac": "d8a011bcc1f7", "host": "192.168.1.154", "kind": "rgbtw" }]
  }
}
```

## Platform options

| Option                  | Default | Meaning                                                   |
| ----------------------- | ------- | --------------------------------------------------------- |
| `pollIntervalSeconds`   | `30`    | How often each bulb is probed                             |
| `failuresBeforeOffline` | `3`     | Consecutive missed probes before reporting not responding |
| `requestTimeoutMs`      | `4000`  | How long to wait for one reply                            |

### Choosing a poll interval

This is the delay before a change made elsewhere shows up. Turn a light on in
the WiZ app and it appears in HomeKit within one interval.

30 seconds is a reasonable default. Going below about 10 is rarely worth it:
these are ESP-class radios, often the weakest devices on the network, and
probing them harder makes them less reliable rather than more current. Going
above a minute starts to feel broken to anyone using the app and HomeKit
together.

### Choosing a failure threshold

One missed datagram is not an outage. UDP has no retransmission, and a single
dropped packet on Wi-Fi is routine, so a threshold of 1 produces a bulb that
flaps in and out of "not responding" all day.

3 is the default and suits most networks. Raise it for a bulb on a weak link,
bearing in mind the cost: with a 30 second interval, a threshold of 3 means up
to 90 seconds before a genuinely dead bulb is reported.

## Device options

| Option                | Required                | Meaning                                                 |
| --------------------- | ----------------------- | ------------------------------------------------------- |
| `name`                | yes                     | What the bulb is called in HomeKit and OpenBridge       |
| `mac`                 | yes                     | As the bulb reports it. Case and separators are ignored |
| `host`                | yes                     | The bulb's address                                      |
| `kind`                | no, defaults to `rgbtw` | What the bulb can do                                    |
| `pollIntervalSeconds` | no                      | Per-bulb override of the platform value                 |

### `kind`

| Value      | HomeKit gets                                        |
| ---------- | --------------------------------------------------- |
| `rgbtw`    | On, Brightness, Colour Temperature, Hue, Saturation |
| `tw`       | On, Brightness, Colour Temperature                  |
| `dimmable` | On, Brightness                                      |
| `socket`   | On                                                  |

This is declared rather than detected, on purpose. A probe only sees the
channels present in the bulb's current state, so a colour bulb sitting in white
mode is indistinguishable from a tunable-white one, and detection would
silently strip its colour controls until someone noticed.

Setting a `kind` richer than the bulb supports gives you controls it will
ignore. Setting one poorer hides controls that work. Neither breaks anything.

### `mac`

Written however you like. `D8:A0:11:BC:C1:F7`, `d8-a0-11-bc-c1-f7` and
`d8a011bcc1f7` are all accepted and normalised to the last form, which is what
the bulb itself reports.

The MAC is what identifies a bulb in HomeKit, so **changing it creates a new
accessory** and the old one's room, scenes and automations are lost. Changing
`host` or `name` is safe.

## Validation

Configuration is checked at startup. An invalid one stops the plugin with the
specific problems listed rather than starting in a half-working state:

```
Configuration is invalid:
  devices.0.host: is required: this plugin never relies on broadcast discovery
  devices.1.mac: must be a 12 character MAC address
```

Declaring the same MAC twice is also refused, since two accessories cannot
share an identity.
