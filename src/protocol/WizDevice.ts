import { EventEmitter } from 'node:events'
import type { WizClient } from './WizClient.js'
import type { WizDeviceConfig, WizPilot, WizPilotWrite } from '../types.js'

export type WizDeviceEvents = {
  /** A fresh reading arrived. Carries the pilot and whether it differs from the last. */
  state: [pilot: WizPilot, changed: boolean]
  /** The bulb crossed into or out of the offline state. Edge-triggered, not per-probe. */
  reachability: [reachable: boolean, reason: string | null]
}

/**
 * One bulb: its address, its last known state, and whether it is answering.
 *
 * The reachability distinction is the whole point. A bulb that is not
 * answering still has a last known state, and the two are different facts. Old
 * behaviour collapsed them, so a bulb that had been off the network for an
 * hour reported `on: false` and was indistinguishable from one someone had
 * simply switched off. Here `reachable` is tracked separately and never
 * inferred from the reading.
 */
export class WizDevice extends EventEmitter<WizDeviceEvents> {
  private pilot: WizPilot | null = null
  private consecutiveFailures = 0
  private offline = false
  private timer: NodeJS.Timeout | null = null
  private lastReason: string | null = null

  constructor(
    readonly config: WizDeviceConfig,
    private readonly client: WizClient,
    private readonly failuresBeforeOffline: number,
  ) {
    super()
  }

  get id(): string {
    return `wiz-${this.config.mac}`
  }

  get reachable(): boolean {
    return !this.offline
  }

  /** The last reading, which may be stale. Callers must check `reachable` too. */
  get lastPilot(): WizPilot | null {
    return this.pilot
  }

  get unreachableReason(): string | null {
    return this.offline ? this.lastReason : null
  }

  /**
   * Probes the bulb once.
   *
   * Never throws: an unreachable bulb is an expected steady state for a light
   * on a switched circuit, not an exceptional one, and a rejected promise on
   * every tick of a polling loop is just noise to swallow somewhere else.
   */
  async probe(): Promise<WizPilot | null> {
    try {
      const pilot = await this.client.getPilot(this.config.host)
      this.recordSuccess()
      const changed = !samePilot(this.pilot, pilot)
      this.pilot = pilot
      this.emit('state', pilot, changed)
      return pilot
    } catch (err) {
      this.recordFailure(err instanceof Error ? err.message : String(err))
      return null
    }
  }

  /**
   * Writes to the bulb and adopts the state it reports back.
   *
   * A write is also a probe: if it lands, the bulb is by definition reachable,
   * so a user pressing a button recovers it immediately rather than waiting
   * out the remaining poll interval.
   */
  async write(params: WizPilotWrite): Promise<void> {
    await this.client.setPilot(this.config.host, params)
    this.recordSuccess()

    // setPilot's own reply only acknowledges the write, so read back rather
    // than assume: a bulb clamps values it dislikes, and reporting the
    // requested value instead of the accepted one is how a UI ends up lying.
    await this.probe()
  }

  private recordSuccess(): void {
    this.consecutiveFailures = 0
    if (this.offline) {
      this.offline = false
      this.lastReason = null
      this.emit('reachability', true, null)
    }
  }

  private recordFailure(reason: string): void {
    this.consecutiveFailures += 1
    this.lastReason = reason
    if (!this.offline && this.consecutiveFailures >= this.failuresBeforeOffline) {
      this.offline = true
      this.emit('reachability', false, reason)
    }
  }

  startPolling(defaultIntervalSeconds: number): void {
    const seconds = this.config.pollIntervalSeconds ?? defaultIntervalSeconds
    if (!(seconds > 0)) return
    this.stopPolling()
    this.timer = setInterval(() => void this.probe(), seconds * 1000)
    // Unref so a polling loop never holds the process open by itself.
    this.timer.unref?.()
  }

  stopPolling(): void {
    if (this.timer) clearInterval(this.timer)
    this.timer = null
  }
}

/** Compares the fields that represent visible state, ignoring noise like rssi. */
export function samePilot(a: WizPilot | null, b: WizPilot | null): boolean {
  if (a === null || b === null) return a === b
  return (
    a.state === b.state &&
    a.dimming === b.dimming &&
    a.temp === b.temp &&
    a.r === b.r &&
    a.g === b.g &&
    a.b === b.b &&
    a.sceneId === b.sceneId
  )
}
