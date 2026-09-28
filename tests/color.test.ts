import { describe, it, expect } from 'vitest'
import {
  hsToRgb,
  rgbToHs,
  kelvinToMired,
  miredToKelvin,
  clampKelvin,
  WIZ_MIN_KELVIN,
  WIZ_MAX_KELVIN,
} from '../src/protocol/color.js'

describe('hue/saturation to RGB', () => {
  it('maps the primaries', () => {
    expect(hsToRgb(0, 100)).toEqual({ r: 255, g: 0, b: 0 })
    expect(hsToRgb(120, 100)).toEqual({ r: 0, g: 255, b: 0 })
    expect(hsToRgb(240, 100)).toEqual({ r: 0, g: 0, b: 255 })
  })

  it('treats zero saturation as white', () => {
    expect(hsToRgb(210, 0)).toEqual({ r: 255, g: 255, b: 255 })
  })

  it('wraps hue rather than clamping it', () => {
    // HomeKit sends 360 for red as readily as 0, and a clamp would render it magenta.
    expect(hsToRgb(360, 100)).toEqual(hsToRgb(0, 100))
    expect(hsToRgb(-120, 100)).toEqual(hsToRgb(240, 100))
  })
})

describe('RGB to hue/saturation', () => {
  it('round-trips the primaries', () => {
    for (const hue of [0, 60, 120, 180, 240, 300]) {
      expect(rgbToHs(hsToRgb(hue, 100))).toEqual({ hue, saturation: 100 })
    }
  })

  it('reports black as unsaturated rather than dividing by zero', () => {
    expect(rgbToHs({ r: 0, g: 0, b: 0 })).toEqual({ hue: 0, saturation: 0 })
  })
})

describe('colour temperature', () => {
  it('round-trips a mired exactly across the range the bulb can represent', () => {
    // HomeKit speaks integer mireds, so this is the round trip that has to be
    // lossless. The endpoints are excluded deliberately: mired 153 is 6536K,
    // past what a WiZ bulb accepts, so the clamp pulls it back to 6500K and it
    // returns as 154. That is the clamp doing its job, not a conversion bug.
    for (const mired of [160, 200, 250, 370, 450]) {
      expect(kelvinToMired(miredToKelvin(mired))).toBe(mired)
    }
  })

  it('round-trips kelvin to within one mired step', () => {
    // A mired is a reciprocal unit, so its step is coarse at the blue end:
    // one mired spans ~1K at 2200K but ~42K at 6500K. Exactness is not
    // available here, and a test demanding it would be testing arithmetic
    // that cannot exist rather than behaviour anyone depends on.
    for (const kelvin of [2200, 2700, 4000, 6500]) {
      const step = Math.abs(miredToKelvin(kelvinToMired(kelvin) + 1) - kelvin)
      expect(Math.abs(miredToKelvin(kelvinToMired(kelvin)) - kelvin)).toBeLessThanOrEqual(step + 1)
    }
  })

  it('clamps to what a WiZ bulb will accept', () => {
    // HomeKit's slider runs wider than the bulb does, and WiZ rejects a
    // setPilot carrying a temperature outside its range outright.
    expect(clampKelvin(1000)).toBe(WIZ_MIN_KELVIN)
    expect(clampKelvin(9000)).toBe(WIZ_MAX_KELVIN)
    expect(miredToKelvin(1000)).toBe(WIZ_MIN_KELVIN)
  })

  it('survives a zero it should never receive', () => {
    expect(miredToKelvin(0)).toBe(WIZ_MAX_KELVIN)
    expect(kelvinToMired(0)).toBe(Math.round(1_000_000 / WIZ_MAX_KELVIN))
  })
})
