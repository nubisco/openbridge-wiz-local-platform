# How it works

Useful when something is behaving oddly and you want to know what the plugin is
actually doing.

## The protocol

WiZ speaks JSON over UDP port 38899. One datagram out, one back:

```json
{ "method": "getPilot", "params": {} }
```

```json
{ "method": "getPilot", "result": { "mac": "d8a011bcc1f7", "state": true, "dimming": 100, "temp": 2700 } }
```

Writes use `setPilot` and the same port. Everything is unicast to the bulb's
own address. The only part of WiZ that is broadcast is discovery, which this
plugin does not use.

## Polling

Each bulb is probed once at startup and then on its interval. A probe either
returns a reading or fails, and that outcome drives everything else.

Requests to the same bulb are coalesced. Five characteristics read at once put
one datagram on the wire, not five, because these radios are usually the
weakest link on the network.

## The offline state machine

```
    probe fails            probe fails            probe succeeds
reachable ──────> reachable ──────> NOT RESPONDING ──────> reachable
        (failures: 1)    (failures: 2..n)                (failures: 0)
```

A bulb is reported as not responding only after `failuresBeforeOffline`
consecutive failures. One missed datagram is not an outage: UDP does not
retransmit and a dropped packet on Wi-Fi is routine.

Recovery is immediate on the first success. Going offline and coming back are
each announced once, not on every probe, so the log stays readable.

## Off versus not answering

These are different facts and the plugin keeps them apart.

A bulb that stops answering **keeps its last known reading**, because that is
often what you want to see. But it also reports `reachable: false` and answers
HomeKit reads with `SERVICE_COMMUNICATION_FAILURE`, which is what makes the
tile grey out and say No Response.

Collapsing the two is how a bulb that has been off the network for an hour
reports `on: false` and looks exactly like one somebody switched off at the
wall. If your bulb shows as not responding, the reading beside it is the last
thing that was true, not the current state.

## Writes

Three things happen on a write that are worth knowing.

**It is read back.** A bulb clamps values it does not like, so after writing,
the plugin re-reads and reports what the bulb accepted rather than what was
asked for. Reporting the request instead is how a UI ends up showing a
brightness the bulb never applied.

**It counts as reachability.** If a write lands, the bulb is by definition
answering, so a bulb that had been marked offline recovers immediately rather
than waiting out the remaining poll interval.

**Off is sent alone.** WiZ rejects a `setPilot` carrying `state: false`
alongside other fields, so turning off is sent as its own message.

## Brightness has no zero

WiZ treats off as `state: false` and will not accept a `dimming` below 10.

So setting brightness to 0 in HomeKit turns the bulb off, and a bulb that is
off reports 0% rather than the 10% it would otherwise return. Without that, an
off bulb would show a lit-looking 10% next to a switch that says off.

## Colour

HomeKit describes colour as hue and saturation, WiZ as RGB channels, so both
are converted on every read and write.

Hue and saturation arrive from HomeKit as two separate writes. The plugin holds
the pair and sends them together, because sending on the first would put the
bulb through a wrong colour on its way to the right one.

Colour temperature is mireds in HomeKit and kelvin in WiZ. WiZ bulbs accept
roughly 2200K to 6500K and reject anything outside, so values are clamped to
what the bulb will take. HomeKit's slider runs wider than the hardware does.
