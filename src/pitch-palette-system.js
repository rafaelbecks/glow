/**
 * Per-track pitch-to-color palettes (always active per track).
 */
import { SETTINGS, UTILS } from './settings.js'

function seedPaletteFromGlobal () {
  const global = SETTINGS.COLORS?.PITCH_PALETTE
  if (Array.isArray(global) && global.length > 0) {
    return [...global]
  }
  return UTILS.generatePitchPalette(
    UTILS.pitchColorFactor,
    UTILS.pitchPaletteSize
  )
}

export class PitchPaletteSystem {
  constructor () {
    this.trackConfigs = new Map()
    this.initializeDefaultConfigs()
  }

  getDefaultConfig () {
    return {
      pitchColorFactor: UTILS.pitchColorFactor || 30,
      pitchPaletteSize: UTILS.pitchPaletteSize || 14,
      pitchPalette: seedPaletteFromGlobal()
    }
  }

  initializeDefaultConfigs () {
    for (let i = 1; i <= 4; i++) {
      this.trackConfigs.set(i, structuredClone(this.getDefaultConfig()))
    }
  }

  getTrackConfig (trackId) {
    return this.trackConfigs.get(trackId) || this.getDefaultConfig()
  }

  getResolvedPalette (trackId) {
    const config = this.getTrackConfig(trackId)
    const size = UTILS.clampPitchPaletteSize(config.pitchPaletteSize)
    const palette =
      Array.isArray(config.pitchPalette) && config.pitchPalette.length > 0
        ? config.pitchPalette.slice(0, size)
        : UTILS.generatePitchPalette(config.pitchColorFactor, size)

    return {
      palette,
      pitchColorFactor: config.pitchColorFactor,
      pitchPaletteSize: size
    }
  }

  updateTrackConfig (trackId, updates = {}) {
    const current = structuredClone(this.getTrackConfig(trackId))

    if (updates.pitchColorFactor !== undefined) {
      current.pitchColorFactor = updates.pitchColorFactor
    }
    if (updates.pitchPaletteSize !== undefined) {
      current.pitchPaletteSize = UTILS.clampPitchPaletteSize(
        updates.pitchPaletteSize
      )
    }
    if (updates.pitchPalette !== undefined) {
      current.pitchPalette = [...updates.pitchPalette]
    }
    if (
      updates.pitchPaletteIndex !== undefined &&
      updates.pitchPaletteColor !== undefined
    ) {
      if (!Array.isArray(current.pitchPalette)) current.pitchPalette = []
      current.pitchPalette[updates.pitchPaletteIndex] =
        updates.pitchPaletteColor
    }

    if (!current.pitchPalette?.length) {
      current.pitchPalette = seedPaletteFromGlobal()
    }

    this.trackConfigs.set(trackId, current)
    return current
  }

  loadTrackConfig (trackId, data) {
    if (!data || typeof data !== 'object') return this.getTrackConfig(trackId)

    const next = this.getDefaultConfig()
    if (data.pitchColorFactor !== undefined) {
      next.pitchColorFactor = data.pitchColorFactor
    }
    if (data.pitchPaletteSize !== undefined) {
      next.pitchPaletteSize = UTILS.clampPitchPaletteSize(data.pitchPaletteSize)
    }
    if (Array.isArray(data.pitchPalette) && data.pitchPalette.length > 0) {
      next.pitchPalette = data.pitchPalette.slice(
        0,
        UTILS.clampPitchPaletteSize(
          data.pitchPaletteSize ?? data.pitchPalette.length
        )
      )
    } else if (data.useCustomPalette === false) {
      // Legacy: inherit global palette from project colors
      next.pitchPalette = seedPaletteFromGlobal()
    }

    this.trackConfigs.set(trackId, next)
    return next
  }

  seedAllTracksFromGlobal (trackIds = [1, 2, 3, 4]) {
    const seed = seedPaletteFromGlobal()
    trackIds.forEach((trackId) => {
      const current = this.getTrackConfig(trackId)
      this.trackConfigs.set(trackId, {
        ...current,
        pitchColorFactor: UTILS.pitchColorFactor,
        pitchPaletteSize: UTILS.pitchPaletteSize,
        pitchPalette: [...seed]
      })
    })
  }

  resetTrackConfig (trackId) {
    this.trackConfigs.set(trackId, structuredClone(this.getDefaultConfig()))
    return this.getTrackConfig(trackId)
  }

  cloneConfig (config) {
    return {
      pitchColorFactor: config.pitchColorFactor,
      pitchPaletteSize: config.pitchPaletteSize,
      pitchPalette: Array.isArray(config.pitchPalette)
        ? [...config.pitchPalette]
        : []
    }
  }
}
