import { describe, it, expect, afterEach } from 'vitest'
import { WizClient } from '../src/protocol/WizClient.js'

/**
 * Exercised against real sockets. The parts worth testing here (timeouts, a
 * reply that never comes, teardown while a request is in flight) only exist
 * because of the network, so mocking dgram would test nothing.
 */
let cleanup: Array<() => void> = []
afterEach(() => {
  for (const fn of cleanup) fn()
  cleanup = []
})

describe('WizClient', () => {
  it('times out when nothing answers, rather than hanging forever', async () => {
    const client = new WizClient(150)
    await client.open()
    cleanup.push(() => client.close())

    // 192.0.2.0/24 is TEST-NET-1: reserved by RFC 5737 and guaranteed unrouted.
    await expect(client.getPilot('192.0.2.1')).rejects.toThrow(/No reply from 192\.0\.2\.1 within 150ms/)
  })

  it('fails in-flight requests when closed instead of leaving them pending', async () => {
    const client = new WizClient(10_000)
    await client.open()

    const pending = client.getPilot('192.0.2.2')
    client.close()

    await expect(pending).rejects.toThrow(/closed before/)
  })

  it('rejects a request made before open', async () => {
    const client = new WizClient(100)
    await expect(client.getPilot('192.0.2.3')).rejects.toThrow(/not open/)
  })

  it('is safe to open twice', async () => {
    const client = new WizClient(100)
    await client.open()
    await client.open()
    cleanup.push(() => client.close())
    expect(true).toBe(true)
  })

  it('is safe to close twice', async () => {
    const client = new WizClient(100)
    await client.open()
    client.close()
    expect(() => client.close()).not.toThrow()
  })
})
