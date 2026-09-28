import { createSocket, type Socket } from 'node:dgram'
import type { WizPilot, WizPilotWrite } from '../types.js'

export const WIZ_PORT = 38899

/**
 * UDP transport for one WiZ installation.
 *
 * Deliberately unicast-only. WiZ's own discovery is a broadcast to
 * 255.255.255.255, and consumer mesh access points routinely drop broadcast
 * frames to save airtime: a TP-Link Deco mesh answers unicast on this exact
 * port while swallowing every broadcast to it. A plugin that needs discovery
 * to find a bulb cannot recover one that changes address on such a network,
 * which is how five bulbs became permanently invisible. Addresses come from
 * config, so there is nothing to discover and nothing to lose.
 */
export class WizClient {
  private socket: Socket | null = null

  /** Resolvers waiting on a reply, keyed by the address that was asked. */
  private pending = new Map<string, Array<(result: WizPilot | Error) => void>>()

  private timers = new Map<string, NodeJS.Timeout>()

  constructor(private readonly requestTimeoutMs = 4000) {}

  /** Binds the shared socket. Safe to call more than once. */
  async open(): Promise<void> {
    if (this.socket) return
    const socket = createSocket({ type: 'udp4', reuseAddr: true })

    socket.on('message', (msg, rinfo) => this.handleReply(msg, rinfo.address))
    // A UDP error is almost always ICMP port-unreachable for one datagram.
    // Tearing down the shared socket over that would take every other bulb
    // down with it, so failures surface as request timeouts instead.
    socket.on('error', () => {})

    await new Promise<void>((resolve, reject) => {
      socket.once('error', reject)
      socket.bind(0, () => {
        socket.off('error', reject)
        resolve()
      })
    })

    this.socket = socket
  }

  close(): void {
    for (const timer of this.timers.values()) clearTimeout(timer)
    this.timers.clear()

    // Anything still waiting will never be answered now, so fail it rather
    // than leaving callers hanging on a promise that cannot settle.
    for (const [host, waiters] of this.pending) {
      for (const done of waiters) done(new Error(`Client closed before ${host} replied`))
    }
    this.pending.clear()

    this.socket?.close()
    this.socket = null
  }

  private handleReply(msg: Buffer, host: string): void {
    const waiters = this.pending.get(host)
    if (!waiters || waiters.length === 0) return

    let parsed: WizPilot | Error
    try {
      const body = JSON.parse(msg.toString('utf8')) as {
        result?: WizPilot
        error?: { message?: string }
      }
      if (body.error) parsed = new Error(body.error.message ?? 'Bulb reported an error')
      else if (body.result) parsed = body.result
      else parsed = new Error('Reply carried neither a result nor an error')
    } catch {
      parsed = new Error('Reply was not valid JSON')
    }

    this.settle(host, parsed)
  }

  private settle(host: string, value: WizPilot | Error): void {
    const timer = this.timers.get(host)
    if (timer) clearTimeout(timer)
    this.timers.delete(host)

    const waiters = this.pending.get(host) ?? []
    this.pending.delete(host)
    for (const done of waiters) done(value)
  }

  /**
   * Sends one request and waits for the bulb's reply.
   *
   * Calls to the same address while a request is in flight are coalesced onto
   * it rather than putting a second datagram on the wire. A bulb polled for
   * five characteristics at once would otherwise receive five identical
   * probes, and these radios are the weakest link on the network.
   */
  private request(host: string, method: string, params: Record<string, unknown>): Promise<WizPilot> {
    if (!this.socket) return Promise.reject(new Error('Client is not open'))

    const inFlight = this.pending.get(host)
    const promise = new Promise<WizPilot>((resolve, reject) => {
      const done = (value: WizPilot | Error) => (value instanceof Error ? reject(value) : resolve(value))
      if (inFlight) inFlight.push(done)
      else this.pending.set(host, [done])
    })

    if (inFlight) return promise

    const payload = Buffer.from(JSON.stringify({ method, params }), 'utf8')
    this.socket.send(payload, WIZ_PORT, host, (err) => {
      if (err) this.settle(host, err)
    })

    this.timers.set(
      host,
      setTimeout(
        () => this.settle(host, new Error(`No reply from ${host} within ${this.requestTimeoutMs}ms`)),
        this.requestTimeoutMs,
      ),
    )

    return promise
  }

  /** Reads the bulb's current state. */
  getPilot(host: string): Promise<WizPilot> {
    return this.request(host, 'getPilot', {})
  }

  /**
   * Writes state to the bulb.
   *
   * WiZ rejects a setPilot that carries both `state:false` and other fields,
   * so turning off is sent on its own. It also has no brightness zero: 0%
   * means off, and the lowest it will accept is 10.
   */
  setPilot(host: string, params: WizPilotWrite): Promise<WizPilot> {
    if (params.state === false) return this.request(host, 'setPilot', { state: false })

    const clean: Record<string, unknown> = { ...params }
    if (typeof clean.dimming === 'number') {
      clean.dimming = Math.max(10, Math.min(100, Math.round(clean.dimming as number)))
    }
    return this.request(host, 'setPilot', clean)
  }
}
