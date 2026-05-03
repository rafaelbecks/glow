import { SETTINGS } from '../../settings.js'
import { PROCEDURAL_BACKGROUND_MODULES } from './procedural/index.js'
import { FULLSCREEN_TRIANGLE_VERTEX } from './glsl/fullscreen-triangle.vert.js'
import { isFragmentBackgroundMode } from './registry.js'

const BLIT_FRAGMENT = `#version 300 es
precision highp float;
uniform sampler2D u_tex;
out vec4 fragColor;
void main() {
  ivec2 sz = textureSize(u_tex, 0);
  vec2 uv = (gl_FragCoord.xy + vec2(0.5)) / vec2(float(sz.x), float(sz.y));
  fragColor = texture(u_tex, uv);
}
`

function compile (gl, type, source) {
  const shader = gl.createShader(type)
  gl.shaderSource(shader, source)
  gl.compileShader(shader)
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error('Background shader compile error:', gl.getShaderInfoLog(shader))
    gl.deleteShader(shader)
    return null
  }
  return shader
}

function linkProgram (gl, vsSource, fsSource) {
  const vs = compile(gl, gl.VERTEX_SHADER, vsSource)
  const fs = compile(gl, gl.FRAGMENT_SHADER, fsSource)
  if (!vs || !fs) return null
  const program = gl.createProgram()
  gl.attachShader(program, vs)
  gl.attachShader(program, fs)
  gl.linkProgram(program)
  gl.deleteShader(vs)
  gl.deleteShader(fs)
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error('Background program link error:', gl.getProgramInfoLog(program))
    gl.deleteProgram(program)
    return null
  }
  return program
}

function cacheUniforms (gl, program, names) {
  const u = {}
  for (const n of names) {
    u[n] = gl.getUniformLocation(program, n)
  }
  return u
}

export class ProceduralBackgroundEngine {
  constructor (canvas) {
    this.canvas = canvas
    this.gl = null
    /** @type {Map<string, { program: WebGLProgram, uniforms: object, module: object }>} */
    this.programs = new Map()
    this.blitProgram = null
    this.blitUniforms = null
    this.feedbackTextures = [null, null]
    this.feedbackFbos = [null, null]
    this.feedbackReadIdx = 0
    this.feedbackSize = { w: 0, h: 0 }
  }

  init () {
    if (!this.canvas) return false
    const gl = this.canvas.getContext('webgl2', { alpha: false, antialias: false, premultipliedAlpha: false })
    if (!gl) {
      console.error('WebGL2 not available for procedural background')
      return false
    }
    this.gl = gl
    gl.disable(gl.DEPTH_TEST)
    gl.disable(gl.BLEND)

    for (const mod of PROCEDURAL_BACKGROUND_MODULES) {
      const program = linkProgram(gl, mod.vertexSource, mod.fragmentSource)
      if (!program) {
        this.dispose()
        return false
      }
      this.programs.set(mod.modeValue, {
        program,
        uniforms: cacheUniforms(gl, program, mod.uniformNames),
        module: mod
      })
    }

    this.blitProgram = linkProgram(gl, FULLSCREEN_TRIANGLE_VERTEX, BLIT_FRAGMENT)
    if (!this.blitProgram) {
      this.dispose()
      return false
    }
    this.blitUniforms = cacheUniforms(gl, this.blitProgram, ['u_tex'])

    return true
  }

  resize () {
    if (!this.canvas) return
    this.canvas.width = window.innerWidth
    this.canvas.height = window.innerHeight
    this.disposeFeedbackResources()
  }

  disposeFeedbackResources () {
    const gl = this.gl
    if (!gl) return
    for (let i = 0; i < 2; i++) {
      if (this.feedbackFbos[i]) {
        gl.deleteFramebuffer(this.feedbackFbos[i])
        this.feedbackFbos[i] = null
      }
      if (this.feedbackTextures[i]) {
        gl.deleteTexture(this.feedbackTextures[i])
        this.feedbackTextures[i] = null
      }
    }
    this.feedbackSize.w = 0
    this.feedbackSize.h = 0
    this.feedbackReadIdx = 0
  }

  ensureFeedbackTargets (w, h) {
    const gl = this.gl
    if (this.feedbackSize.w === w && this.feedbackSize.h === h && this.feedbackTextures[0]) return

    this.disposeFeedbackResources()

    gl.colorMask(true, true, true, true)

    for (let i = 0; i < 2; i++) {
      const tex = gl.createTexture()
      gl.bindTexture(gl.TEXTURE_2D, tex)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
      // Sized RGBA8 is not always color-renderable; unsized RGBA is widely supported for FBOs.
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null)
      this.feedbackTextures[i] = tex

      const fbo = gl.createFramebuffer()
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo)
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0)
      if (gl.drawBuffers) {
        gl.drawBuffers([gl.COLOR_ATTACHMENT0])
      }
      const st = gl.checkFramebufferStatus(gl.FRAMEBUFFER)
      if (st !== gl.FRAMEBUFFER_COMPLETE) {
        console.error('Ghost circle feedback FBO incomplete:', st, 'size', w, h)
      }
      gl.clearColor(0, 0, 0, 1)
      gl.clear(gl.COLOR_BUFFER_BIT)
      this.feedbackFbos[i] = fbo
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, null)
    gl.bindTexture(gl.TEXTURE_2D, null)

    this.feedbackSize.w = w
    this.feedbackSize.h = h
    this.feedbackReadIdx = 0
  }

  render (timeSeconds) {
    const gl = this.gl
    if (!gl) return
    const mode = SETTINGS.CANVAS.SHADER_BACKGROUND_MODE
    if (!isFragmentBackgroundMode(mode)) return

    const entry = this.programs.get(mode)
    if (!entry) return

    const w = this.canvas.width
    const h = this.canvas.height
    if (w < 1 || h < 1) return

    const c = SETTINGS.CANVAS
    const { program, uniforms, module } = entry

    if (module.needsFeedback) {
      this.ensureFeedbackTargets(w, h)
      const readIdx = this.feedbackReadIdx
      const writeIdx = 1 - readIdx

      gl.disable(gl.SCISSOR_TEST)
      gl.colorMask(true, true, true, true)
      gl.bindFramebuffer(gl.FRAMEBUFFER, this.feedbackFbos[writeIdx])
      if (gl.drawBuffers) {
        gl.drawBuffers([gl.COLOR_ATTACHMENT0])
      }
      gl.viewport(0, 0, w, h)
      gl.useProgram(program)
      gl.activeTexture(gl.TEXTURE0)
      gl.bindTexture(gl.TEXTURE_2D, this.feedbackTextures[readIdx])
      module.applyUniforms(gl, uniforms, c, w, h, timeSeconds)
      gl.drawArrays(gl.TRIANGLES, 0, 3)

      gl.bindFramebuffer(gl.FRAMEBUFFER, null)
      if (gl.drawBuffers) {
        gl.drawBuffers([gl.BACK])
      }
      gl.viewport(0, 0, w, h)
      gl.useProgram(this.blitProgram)
      gl.activeTexture(gl.TEXTURE0)
      gl.bindTexture(gl.TEXTURE_2D, this.feedbackTextures[writeIdx])
      gl.uniform1i(this.blitUniforms.u_tex, 0)
      gl.drawArrays(gl.TRIANGLES, 0, 3)

      this.feedbackReadIdx = writeIdx
      gl.bindTexture(gl.TEXTURE_2D, null)
      return
    }

    gl.bindFramebuffer(gl.FRAMEBUFFER, null)
    if (gl.drawBuffers) {
      gl.drawBuffers([gl.BACK])
    }
    gl.viewport(0, 0, w, h)
    gl.useProgram(program)
    module.applyUniforms(gl, uniforms, c, w, h, timeSeconds)
    gl.drawArrays(gl.TRIANGLES, 0, 3)
  }

  dispose () {
    this.disposeFeedbackResources()
    const gl = this.gl
    if (gl) {
      for (const { program } of this.programs.values()) {
        if (program) gl.deleteProgram(program)
      }
      if (this.blitProgram) gl.deleteProgram(this.blitProgram)
    }
    this.programs.clear()
    this.blitProgram = null
    this.blitUniforms = null
    this.gl = null
  }
}
