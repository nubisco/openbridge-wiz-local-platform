# Migrating from homebridge-wiz-lan

## Your bulbs keep their HomeKit identity

Accessory UUIDs here are generated from the bare MAC address, exactly as
`homebridge-wiz-lan` does. HomeKit identifies an accessory by its UUID, so each
bulb keeps its **room, its scenes and its automations** across the swap.

This only holds if the MAC in your configuration matches what the old plugin
saw, which is the MAC the bulb reports. Get it from the bulb itself rather than
from a label: see [Finding your bulbs](/finding-bulbs).

## Remove the old plugin first

Two accessories cannot share a UUID. Running both plugins at once means one of
them loses, unpredictably.

1. Disable `homebridge-wiz-lan` and restart OpenBridge.
2. Confirm the bulbs have disappeared from the devices list.
3. Install and configure this plugin.
4. Restart.

## Translating your configuration

The old plugin discovered bulbs and used its `devices` array only to rename
them. Here the array **is** the device list, so every bulb needs an entry.

Old:

```json
{
  "platform": "WizSmarthome",
  "refreshInterval": 60,
  "devices": [{ "host": "192.168.1.25", "name": "Basement 1", "mac": "d8:a0:11:45:d8:4e" }]
}
```

New:

```json
{
  "pollIntervalSeconds": 60,
  "devices": [{ "name": "Basement 1", "mac": "d8a01145d84e", "host": "192.168.1.25", "kind": "rgbtw" }]
}
```

- `refreshInterval` becomes `pollIntervalSeconds`
- `pingFailuresBeforeOffline` becomes `failuresBeforeOffline`
- `host` is now required, and is the address the plugin actually talks to
  rather than a matching hint
- `kind` is new, and decides which controls the bulb gets

## Names will change

The old plugin applied a configured name only when first creating an accessory,
so a rename never reached a bulb restored from cache. That is why bulbs there
can carry names you changed long ago.

This plugin applies the name on every start. So whatever your configuration
says is what you will see, which may differ from what the old plugin was
showing. Check the list before you migrate if you are unsure which bulb is
which: the MAC is the only thing that identifies one reliably.

## Things you will lose

- **Scenes and light effects.** Readable but not settable here.
- **Adaptive lighting**, if you were using it.
- **Automatic discovery.** Deliberate, and the reason this plugin exists, but
  it does mean a new bulb has to be added to configuration by hand.
