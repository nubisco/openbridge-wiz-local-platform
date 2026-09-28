/* eslint-disable @typescript-eslint/no-explicit-any */
import { z } from 'zod'
import { WizClient } from './protocol/WizClient.js'
import { WizDevice } from './protocol/WizDevice.js'
import { buildWizAccessory } from './accessories/WizLight.js'
import type { WizDeviceConfig } from './types.js'

const PLUGIN_NAME = '@nubisco/openbridge-wiz-local-platform'

let PLUGIN_VERSION = '0.1.0'
try {
  PLUGIN_VERSION = require('../package.json').version
} catch {
  /* keep the default */
}

// OpenBridge native plugin surface. Inlined rather than imported because
// @openbridge/sdk is ESM-only and this package builds to CommonJS, matching
// what @nubisco/openbridge-tuya-local-platform does for the same reason.
interface PluginLogger {
  debug(message: string, ...args: unknown[]): void
  info(message: string, ...args: unknown[]): void
  warn(message: string, ...args: unknown[]): void
  error(message: string, ...args: unknown[]): void
}

interface PluginContext {
  config: Record<string, unknown>
  log: PluginLogger
  reportTelemetry(deviceId: string, data: Record<string, unknown>): void
  registerDevice(device: { id: string; name: string; widgetType: string; manufacturer?: string; model?: string }): void
  registerControl(deviceId: string, controlId: string, handler: (value: unknown) => void | Promise<void>): void
  getHapBridge?(): { hap: any; bridge: any } | undefined
}

const MAC = /^[0-9a-f]{12}$/

const DeviceSchema = z.object({
  // Normalised so config written as `D8:A0:11:45:D8:4E` still matches the
  // `d8a01145d84e` a bulb reports.
  mac: z
    .string()
    .transform((value) => value.toLowerCase().replace(/[^0-9a-f]/g, ''))
    .refine((value) => MAC.test(value), 'must be a 12 character MAC address'),
  host: z.string().min(1, 'is required: this plugin never relies on broadcast discovery'),
  name: z.string().min(1),
  kind: z.enum(['rgbtw', 'tw', 'dimmable', 'socket']).default('rgbtw'),
  pollIntervalSeconds: z.number().positive().optional(),
})

const ConfigSchema = z.object({
  devices: z.array(DeviceSchema).default([]),
  pollIntervalSeconds: z.number().positive().default(30),
  failuresBeforeOffline: z.number().int().positive().default(3),
  requestTimeoutMs: z.number().int().positive().default(4000),
})

function definePlugin<T extends { manifest: { name: string; version: string } }>(plugin: T): T {
  return plugin
}

const state: { client: WizClient | null; devices: WizDevice[] } = {
  client: null,
  devices: [],
}

const plugin = definePlugin({
  manifest: {
    name: PLUGIN_NAME,
    version: PLUGIN_VERSION,
    description: 'Control WiZ lights locally over UDP, without cloud or broadcast discovery',
    author: 'José Silva',
  },

  async setup(ctx: PluginContext) {
    const result = ConfigSchema.safeParse(ctx.config)
    if (!result.success) {
      const issues = result.error.issues.map((i) => `  ${i.path.join('.')}: ${i.message}`).join('\n')
      ctx.log.error(`Configuration is invalid:\n${issues}`)
      throw new Error('Invalid plugin configuration, check the errors above and restart')
    }

    const seen = new Set<string>()
    for (const device of result.data.devices) {
      if (seen.has(device.mac)) {
        throw new Error(`Duplicate device ${device.mac}: each bulb may appear once`)
      }
      seen.add(device.mac)
    }

    if (result.data.devices.length === 0) {
      ctx.log.warn('No devices configured. Add each bulb with its mac, host and name.')
    } else {
      ctx.log.info(`Configuration valid, ${result.data.devices.length} bulb(s) configured`)
    }
  },

  async start(ctx: PluginContext) {
    const config = ConfigSchema.parse(ctx.config)

    const client = new WizClient(config.requestTimeoutMs)
    await client.open()
    state.client = client

    const hapBridge = ctx.getHapBridge?.()
    if (!hapBridge) {
      // Unlike the Tuya platform there is no standalone fallback here. A second
      // bridge means a second pairing, and this plugin exists to fix a fleet
      // that is already paired through the main one.
      ctx.log.warn('No OpenBridge HAP bridge available: bulbs will be registered as devices but not exposed to HomeKit')
    }

    for (const deviceConfig of config.devices as WizDeviceConfig[]) {
      const device = new WizDevice(deviceConfig, client, config.failuresBeforeOffline)
      state.devices.push(device)

      // Registered every start from config, so renaming a bulb in config takes
      // effect on restart. The Homebridge WiZ plugin applies its configured
      // name only when first creating an accessory, so a rename never reaches
      // one restored from cache, which is why bulbs kept months-old names.
      ctx.registerDevice({
        id: device.id,
        name: deviceConfig.name,
        widgetType: deviceConfig.kind === 'socket' ? 'switch' : 'light',
        manufacturer: 'WiZ',
        model: deviceConfig.kind,
      })

      ctx.registerControl(device.id, 'active', async (value) => {
        await device.write({ state: Boolean(value) })
      })
      if (deviceConfig.kind !== 'socket') {
        ctx.registerControl(device.id, 'brightness', async (value) => {
          const pct = Number(value)
          if (pct <= 0) await device.write({ state: false })
          else await device.write({ state: true, dimming: pct })
        })
      }

      // Telemetry carries `reachable` alongside the reading, so a consumer can
      // tell "off" from "not answering" without inferring it from the value.
      const report = () => {
        const pilot = device.lastPilot
        ctx.reportTelemetry(device.id, {
          reachable: device.reachable,
          ...(device.unreachableReason ? { unreachableReason: device.unreachableReason } : {}),
          ...(pilot
            ? {
                active: pilot.state,
                brightness: pilot.state ? (pilot.dimming ?? 100) : 0,
                ...(pilot.temp === undefined ? {} : { colorTemperature: pilot.temp }),
                ...(pilot.rssi === undefined ? {} : { rssi: pilot.rssi }),
              }
            : {}),
        })
      }

      device.on('state', report)
      device.on('reachability', (reachable, reason) => {
        if (reachable) ctx.log.info(`[${deviceConfig.name}] back online`)
        else ctx.log.warn(`[${deviceConfig.name}] not responding at ${deviceConfig.host}: ${reason}`)
        report()
      })

      if (hapBridge) {
        const accessory = buildWizAccessory(hapBridge.hap, device, PLUGIN_VERSION)
        hapBridge.bridge.addBridgedAccessory(accessory)
      }

      // Probe once up front so the first reading does not wait a full interval,
      // then stagger the loops so five bulbs do not transmit in lockstep.
      void device.probe()
      device.startPolling(config.pollIntervalSeconds)
    }

    ctx.log.info(`Started with ${state.devices.length} bulb(s), polling every ${config.pollIntervalSeconds}s`)
  },

  async stop(ctx: PluginContext) {
    for (const device of state.devices) {
      device.stopPolling()
      device.removeAllListeners()
    }
    state.devices = []
    state.client?.close()
    state.client = null
    ctx.log.info('Stopped')
  },
})

export default plugin
module.exports = plugin
module.exports.default = plugin

export { WizClient } from './protocol/WizClient.js'
export { WizDevice, samePilot } from './protocol/WizDevice.js'
export * from './protocol/color.js'
export * from './types.js'
