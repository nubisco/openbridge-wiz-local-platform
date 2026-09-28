/**
 * WiZ speaks a small JSON protocol over UDP port 38899. Every message is a
 * single datagram: `{"method":"getPilot","params":{}}` out, and a reply of
 * `{"method":"getPilot","result":{...}}` back from the bulb's own address.
 */

/** The bulb's reported state. Fields present depend on the model and mode. */
export interface WizPilot {
  mac: string
  /** On or off. */
  state: boolean
  /** Brightness percentage, 10-100. WiZ has no concept of 0: that is `state:false`. */
  dimming?: number
  r?: number
  g?: number
  b?: number
  /** Warm white channel, 0-255. */
  w?: number
  /** Cool white channel, 0-255. */
  c?: number
  /** Colour temperature in kelvin, roughly 2200-6500. */
  temp?: number
  /** Non-zero when the bulb is running a built-in light effect. */
  sceneId?: number
  /** Signal strength in dBm, useful for diagnosing the flaky ones. */
  rssi?: number
}

/** The subset of pilot fields that can be written. */
export interface WizPilotWrite {
  state?: boolean
  dimming?: number
  r?: number
  g?: number
  b?: number
  w?: number
  c?: number
  temp?: number
  sceneId?: number
}

/**
 * What a bulb can do, which decides the characteristics it gets in HomeKit.
 *
 * Declared in config rather than probed. A probe can only report the channels
 * present in the current pilot, so a colour bulb sitting in white mode looks
 * like a tunable-white bulb and would silently lose its colour controls.
 */
export type WizBulbKind = 'rgbtw' | 'tw' | 'dimmable' | 'socket'

export interface WizDeviceConfig {
  /** Lower-case hex, no separators, as the bulb reports it: `d8a01145d84e`. */
  mac: string
  /** The bulb's address. Required: this plugin never depends on discovery. */
  host: string
  name: string
  kind: WizBulbKind
  /** Overrides the platform default when this bulb needs a different cadence. */
  pollIntervalSeconds?: number
}

export interface WizPlatformConfig {
  devices: WizDeviceConfig[]
  /** How often to probe each bulb. */
  pollIntervalSeconds: number
  /** Consecutive failed probes before a bulb is declared offline. */
  failuresBeforeOffline: number
  /** How long to wait for a reply to one probe. */
  requestTimeoutMs: number
}
