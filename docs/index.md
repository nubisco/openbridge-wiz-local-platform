---
layout: home

hero:
  name: OpenBridge WiZ Local
  text: LAN Control for WiZ Lights
  tagline: Control WiZ bulbs locally over UDP through Apple HomeKit. No cloud, no account, and no broadcast discovery to lose them behind.
  actions:
    - theme: brand
      text: Get Started
      link: ./installation
    - theme: alt
      text: Introduction
      link: ./introduction
    - theme: alt
      text: GitHub
      link: https://github.com/nubisco/openbridge-wiz-local-platform
  image:
    src: /logo.svg
    alt: OpenBridge WiZ Local Platform

features:
  - icon:
      src: /openbridge.svg
    title: OpenBridge Native
    details: A native platform plugin, so bulbs appear as real devices with real health rather than through a compatibility shim.
  - icon:
      src: /privacy.svg
    title: 100% Local UDP
    details: Talks straight to each bulb on port 38899. No cloud servers, no account, no internet dependency, no latency.
  - icon:
      src: /protocol.svg
    title: No Discovery To Fail
    details: Every bulb is declared with its address, so a mesh that drops broadcast frames cannot make your lights disappear.
  - icon:
      src: /handshake.svg
    title: Honest Status
    details: A bulb that stops answering says so, with the reason attached, instead of quietly reporting itself as switched off.
  - icon:
      src: /bulb.svg
    title: Colour And White
    details: Hue, saturation and colour temperature on RGBTW bulbs, clamped to the range the hardware actually accepts.
  - icon:
      src: /lightning.svg
    title: Changes Show Up
    details: A light switched at the wall or in the WiZ app is pushed to HomeKit on the next poll, not the next time something reads it.
---
