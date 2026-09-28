---
layout: home

hero:
  name: OpenBridge WiZ Local
  text: WiZ lights, locally
  tagline: Control WiZ bulbs over UDP. No cloud, no account, and no broadcast discovery to lose them behind.
  actions:
    - theme: brand
      text: Get started
      link: /introduction
    - theme: alt
      text: Configuration
      link: /configuration

features:
  - title: No discovery to fail
    details: Every bulb is declared with its address, so a mesh that drops broadcast frames cannot make your lights disappear.
  - title: Honest status
    details: A bulb that stops answering reports as not responding rather than quietly claiming to be switched off.
  - title: Changes show up
    details: A light switched at the wall or in the WiZ app is pushed to HomeKit on the next poll, not the next time something reads it.
---
