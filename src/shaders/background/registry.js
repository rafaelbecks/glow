import { PROCEDURAL_BACKGROUND_MODULES } from './procedural/index.js'

/** GPU-io fluid simulation modes (see fluid-background-engine.js). */
export const FLUID_BACKGROUND_MODES = ['Fluid', 'Pressure', 'Velocity']

const proceduralByModeValue = Object.fromEntries(
  PROCEDURAL_BACKGROUND_MODULES.map(m => [m.modeValue, m])
)

/** Tweakpane `options` map: label → SETTINGS.SHADER_BACKGROUND_MODE value. */
export function getBackgroundModePaneOptions () {
  const o = {
    Fluid: 'Fluid',
    Pressure: 'Pressure',
    Velocity: 'Velocity'
  }
  for (const m of PROCEDURAL_BACKGROUND_MODULES) {
    o[m.displayLabel] = m.modeValue
  }
  return o
}

export function isFluidBackgroundMode (mode) {
  return FLUID_BACKGROUND_MODES.includes(mode)
}

export function isFragmentBackgroundMode (mode) {
  return Boolean(proceduralByModeValue[mode])
}

export function getProceduralModule (mode) {
  return proceduralByModeValue[mode] || null
}

export { PROCEDURAL_BACKGROUND_MODULES }
