/**
 * HomeKit describes colour as hue/saturation, WiZ as RGB channels, and the two
 * need converting in both directions on every read and write.
 */

export interface Rgb {
  r: number
  g: number
  b: number
}

/** Hue 0-360, saturation 0-100, to 8-bit RGB at full value. */
export function hsToRgb(hue: number, saturation: number): Rgb {
  const h = ((hue % 360) + 360) % 360
  const s = Math.max(0, Math.min(100, saturation)) / 100
  const c = s
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = 1 - c

  let r = 0
  let g = 0
  let b = 0
  if (h < 60) [r, g, b] = [c, x, 0]
  else if (h < 120) [r, g, b] = [x, c, 0]
  else if (h < 180) [r, g, b] = [0, c, x]
  else if (h < 240) [r, g, b] = [0, x, c]
  else if (h < 300) [r, g, b] = [x, 0, c]
  else [r, g, b] = [c, 0, x]

  return {
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255),
  }
}

/** 8-bit RGB to hue 0-360 and saturation 0-100. */
export function rgbToHs(rgb: Rgb): { hue: number; saturation: number } {
  const r = rgb.r / 255
  const g = rgb.g / 255
  const b = rgb.b / 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const delta = max - min

  let hue = 0
  if (delta !== 0) {
    if (max === r) hue = 60 * (((g - b) / delta) % 6)
    else if (max === g) hue = 60 * ((b - r) / delta + 2)
    else hue = 60 * ((r - g) / delta + 4)
  }
  if (hue < 0) hue += 360

  const saturation = max === 0 ? 0 : (delta / max) * 100
  return { hue: Math.round(hue), saturation: Math.round(saturation) }
}

/**
 * HomeKit states colour temperature in mireds (reciprocal megakelvin), WiZ in
 * kelvin. The conversion is its own reciprocal, but the clamps are not: WiZ
 * bulbs accept roughly 2200K to 6500K and reject anything outside, so a
 * HomeKit slider that runs wider has to be pinned to what the bulb will take.
 */
export const WIZ_MIN_KELVIN = 2200
export const WIZ_MAX_KELVIN = 6500

export function miredToKelvin(mired: number): number {
  if (mired <= 0) return WIZ_MAX_KELVIN
  return clampKelvin(Math.round(1_000_000 / mired))
}

export function kelvinToMired(kelvin: number): number {
  if (kelvin <= 0) return Math.round(1_000_000 / WIZ_MAX_KELVIN)
  return Math.round(1_000_000 / clampKelvin(kelvin))
}

export function clampKelvin(kelvin: number): number {
  return Math.max(WIZ_MIN_KELVIN, Math.min(WIZ_MAX_KELVIN, kelvin))
}
