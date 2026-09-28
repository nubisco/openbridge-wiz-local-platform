import { describe, it, expect, vi } from 'vitest'
import { WizDevice, samePilot } from '../src/protocol/WizDevice.js'
import type { WizClient } from '../src/protocol/WizClient.js'
import type { WizDeviceConfig, WizPilot } from '../src/types.js'

const CONFIG: WizDeviceConfig = {
  mac: 'd8a01145d84e',
  host: '192.168.1.150',
  name: 'Darts',
  kind: 'rgbtw',
}

function pilot(over: Partial<WizPilot> = {}): WizPilot {
  return { mac: CONFIG.mac, state: true, dimming: 100, ...over }
}

/** A client that answers however the test tells it to. */
function fakeClient(impl: Partial<Record<'getPilot' | 'setPilot', ReturnType<typeof vi.fn>>> = {}) {
  return {
    getPilot: impl.getPilot ?? vi.fn().mockResolvedValue(pilot()),
    setPilot: impl.setPilot ?? vi.fn().mockResolvedValue(pilot()),
  } as unknown as WizClient
}

describe('reachability', () => {
  it('starts reachable and stays so while the bulb answers', async () => {
    const device = new WizDevice(CONFIG, fakeClient(), 3)
    await device.probe()
    expect(device.reachable).toBe(true)
    expect(device.unreachableReason).toBeNull()
  })

  it('only goes offline after the configured number of consecutive failures', async () => {
    const getPilot = vi.fn().mockRejectedValue(new Error('No reply from 192.168.1.150 within 4000ms'))
    const device = new WizDevice(CONFIG, fakeClient({ getPilot }), 3)
    const events: boolean[] = []
    device.on('reachability', (reachable) => events.push(reachable))

    await device.probe()
    expect(device.reachable).toBe(true) // one dropped datagram is not an outage
    await device.probe()
    expect(device.reachable).toBe(true)
    await device.probe()

    expect(device.reachable).toBe(false)
    expect(events).toEqual([false]) // edge-triggered, not once per failed probe
  })

  it('does not re-emit while it stays offline', async () => {
    const getPilot = vi.fn().mockRejectedValue(new Error('nope'))
    const device = new WizDevice(CONFIG, fakeClient({ getPilot }), 1)
    const events: boolean[] = []
    device.on('reachability', (reachable) => events.push(reachable))

    await device.probe()
    await device.probe()
    await device.probe()

    expect(events).toEqual([false])
  })

  it('recovers on the first successful probe', async () => {
    const getPilot = vi.fn().mockRejectedValueOnce(new Error('nope')).mockResolvedValue(pilot())
    const device = new WizDevice(CONFIG, fakeClient({ getPilot }), 1)
    const events: boolean[] = []
    device.on('reachability', (reachable) => events.push(reachable))

    await device.probe()
    expect(device.reachable).toBe(false)
    await device.probe()

    expect(device.reachable).toBe(true)
    expect(events).toEqual([false, true])
  })

  it('keeps the last known reading while unreachable, without implying it is current', async () => {
    // The trap that started all this: a bulb off the network reported `on:
    // false` and was indistinguishable from one switched off. The reading is
    // still available, but `reachable` is what says whether to believe it.
    const getPilot = vi
      .fn()
      .mockResolvedValueOnce(pilot({ state: true, dimming: 80 }))
      .mockRejectedValue(new Error('gone'))
    const device = new WizDevice(CONFIG, fakeClient({ getPilot }), 1)

    await device.probe()
    await device.probe()

    expect(device.reachable).toBe(false)
    expect(device.lastPilot?.state).toBe(true)
    expect(device.lastPilot?.dimming).toBe(80)
    expect(device.unreachableReason).toBe('gone')
  })

  it('never rejects, because an unreachable light is a normal steady state', async () => {
    const getPilot = vi.fn().mockRejectedValue(new Error('switched off at the wall'))
    const device = new WizDevice(CONFIG, fakeClient({ getPilot }), 1)
    await expect(device.probe()).resolves.toBeNull()
  })
})

describe('state events', () => {
  it('flags whether a reading actually differs', async () => {
    const getPilot = vi
      .fn()
      .mockResolvedValueOnce(pilot({ dimming: 50 }))
      .mockResolvedValueOnce(pilot({ dimming: 50 }))
      .mockResolvedValueOnce(pilot({ dimming: 70 }))
    const device = new WizDevice(CONFIG, fakeClient({ getPilot }), 3)
    const changes: boolean[] = []
    device.on('state', (_p, changed) => changes.push(changed))

    await device.probe()
    await device.probe()
    await device.probe()

    expect(changes).toEqual([true, false, true])
  })

  it('ignores signal strength when deciding if state changed', () => {
    // rssi moves on every probe. Treating it as a change would push a HomeKit
    // update every poll for five bulbs that are doing nothing.
    expect(samePilot(pilot({ rssi: -50 }), pilot({ rssi: -71 }))).toBe(true)
    expect(samePilot(pilot({ state: true }), pilot({ state: false }))).toBe(false)
  })
})

describe('writes', () => {
  it('reads back rather than assuming the bulb accepted the value', async () => {
    // A bulb clamps what it dislikes. Reporting the requested value instead of
    // the accepted one is how a UI ends up showing something that is not true.
    const getPilot = vi.fn().mockResolvedValue(pilot({ dimming: 10 }))
    const setPilot = vi.fn().mockResolvedValue(pilot())
    const device = new WizDevice(CONFIG, fakeClient({ getPilot, setPilot }), 3)

    await device.write({ state: true, dimming: 5 })

    expect(setPilot).toHaveBeenCalledOnce()
    expect(getPilot).toHaveBeenCalledOnce()
    expect(device.lastPilot?.dimming).toBe(10)
  })

  it('counts a successful write as proof the bulb is reachable', async () => {
    const getPilot = vi.fn().mockRejectedValue(new Error('nope'))
    const device = new WizDevice(CONFIG, fakeClient({ getPilot }), 3)
    await device.probe()
    await device.probe()
    await device.probe()
    expect(device.reachable).toBe(false)

    // The write lands even though probes were failing, so a user pressing a
    // button recovers the bulb rather than waiting out the poll interval. The
    // read-back that follows fails here, but one failure is not an outage, so
    // it does not undo the recovery.
    await device.write({ state: true })
    expect(device.reachable).toBe(true)
  })
})
