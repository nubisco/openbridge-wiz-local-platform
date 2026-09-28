/* eslint-disable @typescript-eslint/no-explicit-any */
import type { WizDevice } from '../protocol/WizDevice.js'
import type { WizPilot } from '../types.js'
import { hsToRgb, kelvinToMired, miredToKelvin, rgbToHs } from '../protocol/color.js'

/**
 * Binds one WizDevice to one HAP accessory.
 *
 * `hap` is passed in rather than imported so the plugin uses the host's
 * hap-nodejs instance. Two copies of that module in one process means two sets
 * of characteristic classes, and HomeKit silently drops services built from
 * the wrong one.
 */
export function buildWizAccessory(hap: any, device: WizDevice, pluginVersion: string): any {
  const { Accessory, Service, Characteristic, uuid, Categories } = hap
  const cfg = device.config

  // Generated from the bare MAC, deliberately matching what homebridge-wiz-lan
  // does (`uuid.generate(device.mac)`). HomeKit identifies an accessory by its
  // UUID, so keeping it identical means replacing that plugin with this one
  // preserves each bulb's room, scenes and automations. Generating from
  // anything else, the plugin's own device id included, would present five
  // brand new accessories and quietly discard all of it.
  const accessory = new Accessory(cfg.name, uuid.generate(cfg.mac))
  accessory.category = Categories.LIGHTBULB

  accessory
    .getService(Service.AccessoryInformation)
    .setCharacteristic(Characteristic.Manufacturer, 'WiZ')
    .setCharacteristic(Characteristic.Model, cfg.kind)
    .setCharacteristic(Characteristic.SerialNumber, cfg.mac)
    .setCharacteristic(Characteristic.FirmwareRevision, pluginVersion)

  const service = accessory.addService(Service.Lightbulb, cfg.name)

  /**
   * Every read goes through here so that one rule is applied in one place: an
   * unreachable bulb answers with an error, never with its last known value.
   * HomeKit turns that into "No Response", which is the truth. Returning the
   * stale reading instead is what made a bulb that had been off the network
   * for an hour look like one that was merely switched off.
   */
  const read = <T>(project: (pilot: WizPilot) => T): (() => T) => {
    return () => {
      if (!device.reachable || device.lastPilot === null) {
        throw new hap.HapStatusError(hap.HAPStatus.SERVICE_COMMUNICATION_FAILURE)
      }
      return project(device.lastPilot)
    }
  }

  service.getCharacteristic(Characteristic.On).onGet(read((p) => p.state))
  service.getCharacteristic(Characteristic.On).onSet(async (value: any) => {
    await device.write({ state: Boolean(value) })
  })

  if (cfg.kind !== 'socket') {
    service
      .getCharacteristic(Characteristic.Brightness)
      // WiZ has no brightness zero: off is `state:false`, and its lowest
      // accepted dimming is 10. Reporting 0 while off keeps the HomeKit tile
      // consistent with the switch rather than showing a lit-looking 10%.
      .onGet(read((p) => (p.state ? (p.dimming ?? 100) : 0)))
      .onSet(async (value: any) => {
        const pct = Number(value)
        if (pct <= 0) await device.write({ state: false })
        else await device.write({ state: true, dimming: pct })
      })
  }

  if (cfg.kind === 'rgbtw' || cfg.kind === 'tw') {
    service
      .getCharacteristic(Characteristic.ColorTemperature)
      .onGet(read((p) => kelvinToMired(p.temp ?? 2700)))
      .onSet(async (value: any) => {
        await device.write({ state: true, temp: miredToKelvin(Number(value)) })
      })
  }

  if (cfg.kind === 'rgbtw') {
    // HomeKit sets hue and saturation as two separate writes, so the pair has
    // to be held here and sent together. Sending on the first of them would
    // put the bulb through a wrong colour on its way to the right one.
    let pendingHue: number | null = null
    let pendingSat: number | null = null

    const currentHs = () => {
      const p = device.lastPilot
      if (!p || p.r === undefined) return { hue: 0, saturation: 0 }
      return rgbToHs({ r: p.r ?? 0, g: p.g ?? 0, b: p.b ?? 0 })
    }

    const commitColor = async () => {
      const { hue, saturation } = currentHs()
      const rgb = hsToRgb(pendingHue ?? hue, pendingSat ?? saturation)
      pendingHue = null
      pendingSat = null
      await device.write({ state: true, ...rgb })
    }

    service
      .getCharacteristic(Characteristic.Hue)
      .onGet(read(() => currentHs().hue))
      .onSet(async (value: any) => {
        pendingHue = Number(value)
        await commitColor()
      })

    service
      .getCharacteristic(Characteristic.Saturation)
      .onGet(read(() => currentHs().saturation))
      .onSet(async (value: any) => {
        pendingSat = Number(value)
        await commitColor()
      })
  }

  /**
   * Push state changes rather than waiting for HomeKit to ask.
   *
   * A light switched at the wall, in the WiZ app, or by a schedule is a change
   * OpenBridge learns about from its own poll. Without pushing it here,
   * HomeKit would keep showing the old state until something happened to read
   * the characteristic, which is exactly the "I turned it on and nothing
   * updated" complaint.
   */
  device.on('state', (pilot, changed) => {
    if (!changed) return
    service.getCharacteristic(Characteristic.On).updateValue(pilot.state)
    if (cfg.kind !== 'socket') {
      service.getCharacteristic(Characteristic.Brightness).updateValue(pilot.state ? (pilot.dimming ?? 100) : 0)
    }
    if ((cfg.kind === 'rgbtw' || cfg.kind === 'tw') && pilot.temp !== undefined) {
      service.getCharacteristic(Characteristic.ColorTemperature).updateValue(kelvinToMired(pilot.temp))
    }
    if (cfg.kind === 'rgbtw' && pilot.r !== undefined) {
      const { hue, saturation } = rgbToHs({
        r: pilot.r ?? 0,
        g: pilot.g ?? 0,
        b: pilot.b ?? 0,
      })
      service.getCharacteristic(Characteristic.Hue).updateValue(hue)
      service.getCharacteristic(Characteristic.Saturation).updateValue(saturation)
    }
  })

  // Going offline is pushed as an error so the tile greys out on its own,
  // instead of sitting there showing a plausible value until someone taps it.
  device.on('reachability', (reachable) => {
    if (reachable) {
      void device.probe()
      return
    }
    const err = new hap.HapStatusError(hap.HAPStatus.SERVICE_COMMUNICATION_FAILURE)
    for (const name of ['On', 'Brightness', 'ColorTemperature', 'Hue', 'Saturation'] as const) {
      const characteristic = service.getCharacteristic((Characteristic as any)[name])
      if (characteristic) characteristic.updateValue(err)
    }
  })

  return accessory
}
