/**
 * Single entry for canvas shader backgrounds: GPU-io fluid + WebGL2 procedural modules.
 * Implementation modules live under ./shaders/background/ (see shaders/background/README.md).
 */
import { SETTINGS } from './settings.js'
import { FluidBackgroundManager } from './shaders/background/fluid-background-engine.js'
import { ProceduralBackgroundEngine } from './shaders/background/procedural-background-engine.js'
import { isFluidBackgroundMode, isFragmentBackgroundMode } from './shaders/background/registry.js'

export class ShaderBackgroundManager {
  constructor (fluidCanvas, proceduralCanvas) {
    this.fluidCanvas = fluidCanvas
    this.proceduralCanvas = proceduralCanvas
    this.fluid = new FluidBackgroundManager(fluidCanvas)
    this.procedural = proceduralCanvas ? new ProceduralBackgroundEngine(proceduralCanvas) : null
  }

  init () {
    if (this.procedural && !this.procedural.init()) {
      this.procedural.dispose()
      this.procedural = null
    }
    if (!this.fluid.init()) {
      return false
    }
    this.applyFluidSettingsFromCanvas()
    return true
  }

  resizeFluidCanvas () {
    if (this.fluidCanvas) {
      this.fluidCanvas.width = window.innerWidth
      this.fluidCanvas.height = window.innerHeight
    }
  }

  resizeProceduralCanvas () {
    if (this.proceduralCanvas) {
      this.proceduralCanvas.width = window.innerWidth
      this.proceduralCanvas.height = window.innerHeight
    }
    if (this.procedural) {
      this.procedural.resize()
    }
  }

  resizeAll () {
    this.resizeFluidCanvas()
    this.resizeProceduralCanvas()
    if (this.fluid) {
      this.fluid.resize()
    }
  }

  /** Per-frame update: runs fluid sim or procedural draw. */
  update (timeSeconds) {
    const enabled = SETTINGS.CANVAS.SHADER_BACKGROUND_ENABLED
    const mode = SETTINGS.CANVAS.SHADER_BACKGROUND_MODE || 'Fluid'
    if (!enabled) return

    if (isFluidBackgroundMode(mode) && this.fluid) {
      this.fluid.update()
    } else if (isFragmentBackgroundMode(mode) && this.procedural) {
      this.procedural.render(timeSeconds)
    }
  }

  /**
   * Show/hide canvases and enable/disable fluid sim so only one GL path is active.
   */
  syncEngines () {
    const enabled = !!SETTINGS.CANVAS.SHADER_BACKGROUND_ENABLED
    const mode = SETTINGS.CANVAS.SHADER_BACKGROUND_MODE || 'Fluid'
    const fragment = isFragmentBackgroundMode(mode)
    const procReady = fragment && this.procedural

    if (this.fluidCanvas) {
      this.fluidCanvas.style.display = enabled && !fragment ? 'block' : 'none'
    }
    if (this.proceduralCanvas) {
      this.proceduralCanvas.style.display = enabled && procReady ? 'block' : 'none'
    }

    if (this.fluid) {
      this.fluid.setEnabled(enabled && !fragment)
      if (!fragment) {
        this.fluid.setRenderMode(mode)
      }
    }
  }

  applyFluidSettingsFromCanvas () {
    if (!this.fluid) return
    const s = SETTINGS.CANVAS
    this.fluid.setTrailLength(s.SHADER_BACKGROUND_TRAIL_LENGTH || 15)
    const bg = s.SHADER_BACKGROUND_COLOR_FLUID_BACKGROUND || { r: 0.02, g: 0.078, b: 0.157 }
    this.fluid.setColorFluidBackground(bg.r, bg.g, bg.b)
    const tr = s.SHADER_BACKGROUND_COLOR_FLUID_TRAIL || { r: 0, g: 0, b: 0.2 }
    this.fluid.setColorFluidTrail(tr.r, tr.g, tr.b)
    const pr = s.SHADER_BACKGROUND_COLOR_PRESSURE || { r: 0.02, g: 0.078, b: 0.157 }
    this.fluid.setColorPressure(pr.r, pr.g, pr.b)
    const vl = s.SHADER_BACKGROUND_COLOR_VELOCITY || { r: 0.259, g: 0.227, b: 0.184 }
    this.fluid.setColorVelocity(vl.r, vl.g, vl.b)
    if (s.SHADER_BACKGROUND_CURSOR_MODE !== false) {
      this.fluid.setCursorMode(true)
    } else {
      this.fluid.setCursorMode(false)
    }
    this.syncEngines()
  }

  setFluidTrailLength (length) {
    if (this.fluid) this.fluid.setTrailLength(length)
  }

  setFluidColorFluidBackground (color) {
    if (this.fluid && color) this.fluid.setColorFluidBackground(color.r, color.g, color.b)
  }

  setFluidColorFluidTrail (color) {
    if (this.fluid && color) this.fluid.setColorFluidTrail(color.r, color.g, color.b)
  }

  setFluidColorPressure (color) {
    if (this.fluid && color) this.fluid.setColorPressure(color.r, color.g, color.b)
  }

  setFluidColorVelocity (color) {
    if (this.fluid && color) this.fluid.setColorVelocity(color.r, color.g, color.b)
  }

  setFluidCursorMode (enabled) {
    if (this.fluid) this.fluid.setCursorMode(enabled)
  }

  dispose () {
    if (this.procedural) {
      this.procedural.dispose()
    }
    if (this.fluid) {
      this.fluid.dispose()
    }
  }
}
