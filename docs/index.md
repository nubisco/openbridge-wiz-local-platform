---
layout: nubisco
title: 'OpenBridge WiZ Local'
intro: 'Control WiZ bulbs locally over UDP through Apple HomeKit. No cloud, no account, and no broadcast discovery to lose them behind.'
---

## Where to start

- [Get Started](./installation)
- [Introduction](./introduction)
- [GitHub](https://github.com/nubisco/openbridge-wiz-local-platform)

## OpenBridge Native

A native platform plugin, so bulbs appear as real devices with real health rather than through a compatibility shim.

## 100% Local UDP

Talks straight to each bulb on port 38899. No cloud servers, no account, no internet dependency, no latency.

## No Discovery To Fail

Every bulb is declared with its address, so a mesh that drops broadcast frames cannot make your lights disappear.

## Honest Status

A bulb that stops answering says so, with the reason attached, instead of quietly reporting itself as switched off.

## Colour And White

Hue, saturation and colour temperature on RGBTW bulbs, clamped to the range the hardware actually accepts.

## Changes Show Up

A light switched at the wall or in the WiZ app is pushed to HomeKit on the next poll, not the next time something reads it.
