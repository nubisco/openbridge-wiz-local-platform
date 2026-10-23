# [2.0.0](https://github.com/nubisco/openbridge-wiz-local-platform/compare/v1.0.0...v2.0.0) (2026-10-23)


* feat!: require Node.js 22.23.4 or newer ([6c12a38](https://github.com/nubisco/openbridge-wiz-local-platform/commit/6c12a3865c8f9fc055cab06aa88bce239072de5d))


### BREAKING CHANGES

* Node.js 20 is no longer supported. Node 20 reached end of
life in April 2026 and gets no security fixes, so it stays exposed to the
October 2026 Node.js security release (the Brotli remote code execution
CVE-2026-111497 and the TLS hostname verification bypasses). Node 22
releases before 22.23.4 are affected by the same release. Run OpenBridge on
Node.js 22.23.4 or newer, or any Node 24 release, before updating this
plugin.

# 1.0.0 (2026-09-28)


### Features

* keep homebridge-wiz-lan's accessory UUIDs so HomeKit identity survives the swap ([f64ec2e](https://github.com/nubisco/openbridge-wiz-local-platform/commit/f64ec2eae7d813a8832cfae26ef54ccd9945bb65))
* WiZ local platform for OpenBridge ([506da93](https://github.com/nubisco/openbridge-wiz-local-platform/commit/506da938c5aaa3c9a1319cb90dec765870fa4020))
