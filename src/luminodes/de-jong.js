// De Jong attractor luminode (WebGL shader implementation)
// Inspired by Mike Bostock's "de Jong Attractor II" Observable notebook.
// Exposes parameters a, b, c, d and supports two color modes:
//  - Rainbow cubehelix-style (from the original shader)
//  - MIDI-based color using UTILS.pitchToColor, like other 3D luminodes

import { SETTINGS, UTILS } from '../settings.js'
import {
  DE_JONG_VERTEX_SHADER,
  DE_JONG_FRAGMENT_SHADER
} from './shaders/de-jong-shaders.js'


//TODO This should be in a separate shader-hander file, and document how to create both canvas drawing and shaders based modules.
function createShader (gl, type, source) {
  const shader = gl.createShader(type)
  gl.shaderSource(shader, source)
  gl.compileShader(shader)
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error('DeJong shader compile error:', gl.getShaderInfoLog(shader))
    gl.deleteShader(shader)
    return null
  }
  return shader
}

function createProgram (gl, vertexSource, fragmentSource) {
  const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexSource)
  const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentSource)
  if (!vertexShader || !fragmentShader) return null

  const program = gl.createProgram()
  gl.attachShader(program, vertexShader)
  gl.attachShader(program, fragmentShader)
  gl.linkProgram(program)

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error('DeJong program link error:', gl.getProgramInfoLog(program))
    gl.deleteProgram(program)
    return null
  }

  gl.deleteShader(vertexShader)
  gl.deleteShader(fragmentShader)
  return program
}

export class DeJongLuminode {
  constructor (canvasDrawer) {
    this.canvasDrawer = canvasDrawer
    this.ctx = canvasDrawer.getContext()
    this.dimensions = canvasDrawer.getDimensions()
    this.lastChordSignature = ''
    this.currentBaseHue = Math.floor(Math.random() * 360)

    // Offscreen WebGL canvas for GPU rendering
    this.glCanvas = document.createElement('canvas')
    this.gl = this.glCanvas.getContext('webgl', {
      antialias: false,
      depth: false,
      stencil: false,
      premultipliedAlpha: false,
      preserveDrawingBuffer: false
    })

    this.program = null
    this.attribs = {}
    this.uniforms = {}
    this.vertexBuffer = null
    this.currentIterations = 0

    if (this.gl) {
      this.initGL()
    } else {
      console.warn('WebGL not available for DeJongLuminode, falling back to no-op.')
    }
  }

  //TODO: Same as the createProgram. There should be a separate shader-handler module for this, and it should be reusable.
  initGL () {
    if (!this.gl) return

    const gl = this.gl
    this.program = createProgram(gl, DE_JONG_VERTEX_SHADER, DE_JONG_FRAGMENT_SHADER)
    if (!this.program) {
      console.error('Failed to initialize DeJong WebGL program')
      return
    }

    gl.useProgram(this.program)

    // Attribute locations
    this.attribs.a_position = gl.getAttribLocation(this.program, 'a_position')

    // Uniform locations
    this.uniforms.u_a = gl.getUniformLocation(this.program, 'u_a')
    this.uniforms.u_b = gl.getUniformLocation(this.program, 'u_b')
    this.uniforms.u_c = gl.getUniformLocation(this.program, 'u_c')
    this.uniforms.u_d = gl.getUniformLocation(this.program, 'u_d')
    this.uniforms.u_pointSize = gl.getUniformLocation(this.program, 'u_pointSize')
    this.uniforms.u_scale = gl.getUniformLocation(this.program, 'u_scale')
    this.uniforms.u_colorMode = gl.getUniformLocation(this.program, 'u_colorMode')
    this.uniforms.u_midiColor = gl.getUniformLocation(this.program, 'u_midiColor')
    this.uniforms.u_time = gl.getUniformLocation(this.program, 'u_time')

    // Create vertex buffer (will be sized when drawing based on ITERATIONS)
    this.vertexBuffer = gl.createBuffer()
  }

  draw (t, notes, useColor = false, layout = { x: 0, y: 0, rotation: 0 }) {
    if (!this.gl || !this.program) return

    this.dimensions = this.canvasDrawer.getDimensions()
    const { width, height } = this.dimensions

    // Resize offscreen GL canvas to match main canvas
    const dpr = window.devicePixelRatio || 1
    const targetWidth = Math.floor(width * dpr)
    const targetHeight = Math.floor(height * dpr)
    if (this.glCanvas.width !== targetWidth || this.glCanvas.height !== targetHeight) {
      this.glCanvas.width = targetWidth
      this.glCanvas.height = targetHeight
    }

    const moduleSettings = SETTINGS.MODULES.DE_JONG
    const a = moduleSettings.A
    const b = moduleSettings.B
    const c = moduleSettings.C
    const d = moduleSettings.D
    const iterations = moduleSettings.ITERATIONS
    const pointSize = moduleSettings.POINT_SIZE
    const scale = moduleSettings.SCALE
    // Ensure COLOR_MODE is a number (0=rainbow, 1=MIDI, 2=black&white)
    // Default to 0 (rainbow) if not set
    let colorMode = 0
    if (moduleSettings.COLOR_MODE !== undefined) {
      if (typeof moduleSettings.COLOR_MODE === 'number') {
        colorMode = moduleSettings.COLOR_MODE
      } else {
        colorMode = parseInt(moduleSettings.COLOR_MODE, 10)
        if (isNaN(colorMode)) colorMode = 0
      }
    }

    // Update chord-based hue when MIDI notes change
    const chordSig = notes.map(n => n.midi).sort().join('-')
    if (chordSig !== this.lastChordSignature) {
      this.lastChordSignature = chordSig
      this.currentBaseHue = Math.floor(Math.random() * 360)
    }

    const gl = this.gl
    gl.viewport(0, 0, this.glCanvas.width, this.glCanvas.height)
    gl.clearColor(0, 0, 0, 0)
    gl.clear(gl.COLOR_BUFFER_BIT)

    gl.useProgram(this.program)

    // (Re)create vertex buffer data if iterations changed
    if (iterations !== this.currentIterations) {
      this.currentIterations = iterations
      const data = new Float32Array(this.currentIterations * 2)
      for (let i = 0; i < this.currentIterations * 2; i++) {
        data[i] = Math.random() * 2 - 1 // [-1, 1]
      }
      gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer)
      gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW)
    } else {
      gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer)
    }

    // Enable attribute
    gl.enableVertexAttribArray(this.attribs.a_position)
    gl.vertexAttribPointer(this.attribs.a_position, 2, gl.FLOAT, false, 0, 0)

    // Set De Jong parameters
    gl.uniform1f(this.uniforms.u_a, a)
    gl.uniform1f(this.uniforms.u_b, b)
    gl.uniform1f(this.uniforms.u_c, c)
    gl.uniform1f(this.uniforms.u_d, d)

    // Point size scales with devicePixelRatio so UI feels similar
    gl.uniform1f(this.uniforms.u_pointSize, pointSize * dpr)

    // Scale uniform (applied in vertex shader)
    gl.uniform1f(this.uniforms.u_scale, scale)

    // Color mode: 0 = rainbow, 1 = MIDI, 2 = black & white
    // useColor parameter can override if explicitly set, otherwise use settings
    let effectiveColorMode = colorMode
    if (useColor !== undefined && useColor !== false) {
      // If useColor is explicitly passed, use it (for backward compatibility)
      effectiveColorMode = typeof useColor === 'number' ? useColor : 1
    }
    
    // Ensure it's an integer for the shader (clamp to valid range)
    effectiveColorMode = Math.max(0, Math.min(2, Math.floor(effectiveColorMode)))
    
    gl.uniform1i(this.uniforms.u_colorMode, effectiveColorMode)

    // Time uniform for animated rainbow phase (matches engine's time base)
    gl.uniform1f(this.uniforms.u_time, t)

    // Set MIDI color if in MIDI mode
    if (effectiveColorMode === 1) {
      const midiValue = notes.length > 0 ? notes[0].midi : 60
      const hsla = UTILS.pitchToColor(midiValue) // hsla() string
      const [r, g, bCol] = UTILS.hslaToRgb(hsla)
      gl.uniform3f(this.uniforms.u_midiColor, r, g, bCol)
    } else {
      gl.uniform3f(this.uniforms.u_midiColor, 1, 1, 1) // unused, but set anyway
    }

    // Draw attractor
    gl.drawArrays(gl.POINTS, 0, this.currentIterations)

    // Composite WebGL canvas onto the main 2D canvas using the layout transform
    this.canvasDrawer.applyLayoutTransform(layout)

    // Draw centered
    this.ctx.save()
    const drawWidth = width
    const drawHeight = height
    this.ctx.drawImage(
      this.glCanvas,
      0,
      0,
      this.glCanvas.width,
      this.glCanvas.height,
      -drawWidth / 2,
      -drawHeight / 2,
      drawWidth,
      drawHeight
    )
    this.ctx.restore()

    this.canvasDrawer.restoreLayoutTransform()
  }
}

