# Finding your bulbs

Each bulb needs three things in configuration: its MAC address, its current IP,
and a name. The first two come from the bulb itself.

## Ask a bulb directly

If you already know an address, ask it:

```sh
echo -n '{"method":"getPilot","params":{}}' | nc -u -w 2 192.168.1.154 38899
```

```json
{
  "method": "getPilot",
  "env": "pro",
  "result": {
    "mac": "d8a011bcc1f7",
    "state": true,
    "dimming": 100,
    "temp": 2700,
    "rssi": -63
  }
}
```

That reply gives you the `mac`, and proves the bulb answers unicast on that
address, which is exactly what the plugin needs.

`rssi` is worth noting while you are here. Anything weaker than about -70 dBm
is a bulb that will drop out intermittently, and no amount of configuration
fixes a weak radio link.

## Find the addresses in the first place

The reliable source is your DHCP server's lease table, not a network scan.
WiZ's own MAC prefix is `d8:a0:11`, so on a Synology NAS running DHCP Server:

```sh
grep -i 'd8:a0:11' /etc/dhcpd/dhcpd.conf.leases
```

On a router, look for the lease list in its admin interface.

## Why not scan?

Because on a mesh, a scan lies to you.

`nmap -sn` relies on ARP, and mesh access points commonly answer ARP on behalf
of clients or suppress the broadcast that carries the request. A WiZ broadcast
discovery has the same problem, which is the whole reason this plugin does not
use one. Devices that answer a direct request perfectly well can be invisible
to a sweep.

If you want to check whether broadcast works on your network at all:

```sh
echo -n '{"method":"getPilot","params":{}}' | nc -u -b -w 3 255.255.255.255 38899
```

Silence here, while a unicast request to a known bulb succeeds, means broadcast
is being dropped. That is a normal result on a Deco mesh, and it is not
something you need to fix for this plugin.
