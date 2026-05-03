import { portalBackgroundShader } from './portal.js'
import { discoSunBackgroundShader } from './disco-sun.js'
import { balatroBackgroundShader } from './balatro.js'
import { chromaGradientsBackgroundShader } from './chroma-gradients.js'

/**
 * Ordered list of full-screen fragment background modules (WebGL2).
 * Register new entries here — see ../README.md.
 */
export const PROCEDURAL_BACKGROUND_MODULES = [
  portalBackgroundShader,
  discoSunBackgroundShader,
  balatroBackgroundShader,
  chromaGradientsBackgroundShader,
]
