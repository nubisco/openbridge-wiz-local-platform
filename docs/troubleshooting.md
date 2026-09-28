# Troubleshooting

## A bulb shows as not responding

Work outward from the bulb.

**1. Does it answer at all?**

```sh
echo -n '{"method":"getPilot","params":{}}' | nc -u -w 2 192.168.1.154 38899
```

A reply means the bulb is fine and the problem is configuration. Silence means
the bulb is not reachable at that address.

Do not use `ping` for this. Many WiZ bulbs ignore ICMP entirely, so a failed
ping tells you nothing.

**2. Is it still at that address?**

Check your DHCP lease table for the bulb's MAC. This is the most common cause:
the bulb moved and the configuration did not.

```sh
grep -i 'd8:a0:11' /etc/dhcpd/dhcpd.conf.leases
```

A lease is a record of an address being granted, not proof the device is still
there. If the lease says one thing and the bulb does not answer, it has most
likely left the network since.

**3. Is it actually powered?**

A WiZ bulb on a switched circuit is dead when the wall switch is off. That is
not a fault, and there is nothing the plugin can do about it. Smart bulbs want
permanent power.

**4. Is the signal good enough?**

`rssi` comes back in every `getPilot` reply. Weaker than about -70 dBm means a
bulb that will drop out intermittently no matter what you configure. Compare
with a bulb that behaves: a 15 dB difference between two bulbs on the same
access point is telling you something physical.

## A bulb responds to the test but the plugin says otherwise

Check the MAC in your configuration matches the one in the reply. The plugin
addresses by `host` but identifies by `mac`, and a mismatched MAC gives you an
accessory that is not the bulb you think it is.

## It says not responding, then fine, then not responding

Flapping usually means `failuresBeforeOffline` is too low for the link, or the
poll interval is too aggressive. Try a threshold of 3 or more and an interval
of 30 seconds or longer before concluding the bulb is faulty.

If one particular bulb flaps and the others do not, check its `rssi`. That is a
radio problem and configuration only hides it.

## Everything is not responding

If every bulb went at once, suspect something common to all of them rather than
the bulbs:

- Did the bridge host change network, or lose its own connection?
- Did all the addresses change at once? A DHCP server change, or a batch of new
  reservations taking effect, will do exactly this.
- Is the plugin actually running? Check the OpenBridge log at startup for the
  line naming how many bulbs it started with.

## Brightness snaps to 10%

That is the bulb, not the plugin. WiZ will not accept a `dimming` below 10, so
anything lower is clamped. 0% is sent as off instead.

## A colour bulb has no colour controls

Check `kind` in configuration. `tw` and `dimmable` deliberately do not publish
Hue and Saturation. It is declared rather than detected, so a bulb that can do
colour will still be presented as tunable-white if you told it to be.

## Nothing appears in HomeKit at all

Look for this in the OpenBridge log:

```
No OpenBridge HAP bridge available: bulbs will be registered as devices but not exposed to HomeKit
```

That means the plugin could not reach the host's HAP bridge. The bulbs will
still appear in OpenBridge's own devices list, but not in HomeKit. Unlike some
plugins this one does not fall back to publishing its own bridge, because a
second bridge means a second pairing.
