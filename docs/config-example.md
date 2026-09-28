# Examples

## A single bulb

```json
{
  "name": "@nubisco/openbridge-wiz-local-platform",
  "enabled": true,
  "config": {
    "devices": [{ "name": "Desk Lamp", "mac": "d8a011bcc1f7", "host": "192.168.1.154" }]
  }
}
```

`kind` defaults to `rgbtw`, so a colour bulb needs nothing else.

## A room of bulbs

```json
{
  "config": {
    "pollIntervalSeconds": 30,
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

## Mixed types

```json
{
  "config": {
    "devices": [
      { "name": "Hallway", "mac": "d8a011bcc1f7", "host": "192.168.1.154", "kind": "rgbtw" },
      { "name": "Reading Light", "mac": "d8a01145da5c", "host": "192.168.1.151", "kind": "tw" },
      { "name": "Under Cabinet", "mac": "d8a01145dc70", "host": "192.168.1.152", "kind": "dimmable" },
      { "name": "Christmas Tree", "mac": "d8a011bc31cd", "host": "192.168.1.153", "kind": "socket" }
    ]
  }
}
```

## One bulb on a weak link

```json
{
  "config": {
    "pollIntervalSeconds": 30,
    "failuresBeforeOffline": 3,
    "devices": [
      { "name": "Kitchen", "mac": "d8a011bcc1f7", "host": "192.168.1.154" },
      { "name": "Garden", "mac": "d8a01145da5c", "host": "192.168.1.151", "pollIntervalSeconds": 120 }
    ]
  }
}
```

A distant bulb polled less often misses fewer probes and spends less time
wrongly marked offline. It is a workaround for a radio problem, not a fix:
check `rssi` and consider moving an access point.
