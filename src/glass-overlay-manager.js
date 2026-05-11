import { SETTINGS } from './settings.js'

function compile (gl, type, source) {
  const shader = gl.createShader(type)
  gl.shaderSource(shader, source)
  gl.compileShader(shader)
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error('Glass overlay shader compile error:', gl.getShaderInfoLog(shader))
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
    console.error('Glass overlay program link error:', gl.getProgramInfoLog(program))
    gl.deleteProgram(program)
    return null
  }
  return program
}

const VERTEX = `#version 300 es
precision highp float;
const vec2 POS[3] = vec2[3](
  vec2(-1.0, -1.0),
  vec2( 3.0, -1.0),
  vec2(-1.0,  3.0)
);
out vec2 vUv;
void main() {
  vec2 p = POS[gl_VertexID];
  vUv = p * 0.5 + 0.5;
  gl_Position = vec4(p, 0.0, 1.0);
}`

const FRAGMENT = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 fragColor;

uniform sampler2D u_sceneTex;
uniform vec2 u_resolution;
uniform vec2 u_center;
uniform vec2 u_size;
uniform float u_radius;
uniform float u_bezel;
uniform float u_thickness;
uniform float u_ior;
uniform float u_blur;
uniform float u_specular;
uniform float u_tint;
uniform float u_shadow;
uniform int u_mode;
uniform vec2 u_brickSize;
uniform vec2 u_brickOffset;
uniform float u_brickGap;

float sdRoundedRect(vec2 p, vec2 halfSize, float r) {
  vec2 q = abs(p) - halfSize + r;
  return min(max(q.x, q.y), 0.0) + length(max(q, 0.0)) - r;
}

float surfaceHeight(float t) {
  float s = 1.0 - t;
  return pow(1.0 - s * s * s * s, 0.25);
}

vec3 sampleScene(vec2 uv) {
  vec2 safeUv = clamp(uv, vec2(0.0), vec2(1.0));
  return texture(u_sceneTex, safeUv).rgb;
}

vec3 sampleSceneBlurred(vec2 uv, float radius) {
  if (radius < 0.5) return sampleScene(uv);
  vec3 sum = vec3(0.0);
  vec2 px = 1.0 / u_resolution;
  vec2 offsets[12];
  offsets[0] = vec2(-0.326, -0.406);
  offsets[1] = vec2(-0.840, -0.074);
  offsets[2] = vec2(-0.696, 0.457);
  offsets[3] = vec2(-0.203, 0.621);
  offsets[4] = vec2(0.962, -0.195);
  offsets[5] = vec2(0.473, -0.480);
  offsets[6] = vec2(0.519, 0.767);
  offsets[7] = vec2(0.185, -0.893);
  offsets[8] = vec2(0.507, 0.064);
  offsets[9] = vec2(0.896, 0.412);
  offsets[10] = vec2(-0.322, -0.933);
  offsets[11] = vec2(-0.792, -0.598);
  for (int i = 0; i < 12; i++) {
    sum += sampleScene(uv + offsets[i] * radius * px);
  }
  return sum / 12.0;
}

float tileRoundedSd(vec2 p, out vec2 tileCenter, out vec2 halfSize) {
  vec2 pitch = u_brickSize + vec2(u_brickGap);
  vec2 local = p - u_brickOffset;
  vec2 id = floor((local + 0.5 * pitch) / pitch);
  tileCenter = id * pitch + u_brickOffset;
  halfSize = 0.5 * u_brickSize;
  vec2 q = p - tileCenter;
  float radius = min(u_radius, min(halfSize.x, halfSize.y) - 1.0);
  return sdRoundedRect(q, halfSize, max(1.0, radius));
}

void main() {
  vec2 screenPx = vec2(vUv.x, 1.0 - vUv.y) * u_resolution;
  vec2 p = screenPx - u_center;

  float sd;
  vec2 halfSize;
  vec2 localP = p;
  if (u_mode == 1) {
    vec2 tileCenter;
    sd = tileRoundedSd(screenPx, tileCenter, halfSize);
    localP = screenPx - tileCenter;
  } else {
    halfSize = max(u_size * 0.5, vec2(1.0));
    float radius = min(u_radius, min(halfSize.x, halfSize.y) - 1.0);
    sd = sdRoundedRect(localP, halfSize, max(1.0, radius));
  }

  if (sd > 0.0) {
    float shadowFalloff = exp(-sd * sd / 800.0);
    float shadowAlpha = u_shadow * shadowFalloff * 0.6;
    fragColor = vec4(0.0, 0.0, 0.0, shadowAlpha);
    return;
  }

  float distFromEdge = -sd;
  float bezel = min(u_bezel, min(halfSize.x, halfSize.y) - 1.0);
  bezel = max(bezel, 1.0);
  float t = clamp(distFromEdge / bezel, 0.0, 1.0);

  float h = surfaceHeight(t);
  float dt = 0.001;
  float h2 = surfaceHeight(min(t + dt, 1.0));
  float dh = (h2 - h) / dt;

  float slopeAngle = atan(dh * (u_thickness / bezel));
  float sinR = sin(slopeAngle) / max(u_ior, 1.0);
  sinR = clamp(sinR, -1.0, 1.0);
  float thetaR = asin(sinR);
  float displacement = h * u_thickness * (tan(slopeAngle) - tan(thetaR));

  vec2 grad;
  float eps = 0.5;
  if (u_mode == 1) {
    vec2 tileCenter;
    vec2 hs;
    float base = tileRoundedSd(screenPx, tileCenter, hs);
    grad.x = tileRoundedSd(screenPx + vec2(eps, 0.0), tileCenter, hs) - base;
    grad.y = tileRoundedSd(screenPx + vec2(0.0, eps), tileCenter, hs) - base;
  } else {
    grad.x = sdRoundedRect(localP + vec2(eps, 0.0), halfSize, u_radius) - sd;
    grad.y = sdRoundedRect(localP + vec2(0.0, eps), halfSize, u_radius) - sd;
  }
  grad = normalize(grad + vec2(1e-6));
  vec2 offset = -grad * displacement / u_resolution;

  vec2 refractedUV = (screenPx / u_resolution) + offset;
  vec3 color = sampleSceneBlurred(refractedUV, u_blur);

  vec2 lightDir = normalize(vec2(0.5, -0.7));
  float rimDot = abs(dot(grad, lightDir));
  float rimFalloff = 1.0 - smoothstep(0.0, bezel * 0.45, distFromEdge);
  float specHighlight = pow(max(rimDot * rimFalloff, 0.0), 1.5);
  color += vec3(specHighlight * u_specular);

  float innerShadow = 1.0 - smoothstep(0.0, bezel * 0.65, distFromEdge);
  color *= mix(1.0, 0.72, innerShadow * 0.3);

  float innerRim = smoothstep(0.0, 2.0, distFromEdge) * (1.0 - smoothstep(2.0, 5.0, distFromEdge));
  color += vec3(innerRim * 0.14 * u_specular);

  color = mix(color, vec3(1.0), u_tint);
  float alpha = smoothstep(0.0, 1.4, distFromEdge);
  fragColor = vec4(color, alpha);
}`

// Rain Screen — Jakob Thomsen, Shadertoy 4ljXDy (CC BY-NC-SA 3.0)
// Adapted to WebGL2; samples scene as u_sceneTex (Shadertoy iChannel0).
const RAIN_FRAGMENT = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 fragColor;

uniform sampler2D u_sceneTex;
uniform vec2 u_resolution;
uniform float u_time;
uniform float u_distortion;
uniform float u_noiseScale;
uniform float u_timeScale;
uniform float u_patternDrift;
uniform float u_sharpness;

#define PI 3.1415926

vec2 hash(vec2 p) {
  p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
  return fract(sin(p) * 18.5453);
}

float grid_noise(float t, vec2 v) {
  vec2 fl = floor(v), fr = fract(v);
  float mindist = 1e9;
  for (int y = -1; y <= 1; y++) {
    for (int x = -1; x <= 1; x++) {
      vec2 offset = vec2(float(x), float(y));
      vec2 pos = 0.5 + 0.5 * cos(2.0 * PI * (t * u_patternDrift + hash(fl + offset)) + vec2(0.0, 1.6));
      mindist = min(mindist, length(pos + offset - fr));
    }
  }
  return mindist;
}

float blob_noise(float t, vec2 v, float s) {
  return pow(0.5 + 0.5 * cos(PI * clamp(grid_noise(t, v) * 2.0, 0.0, 1.0)), s);
}

vec3 blob_noise_normal(float t, vec2 v, float s) {
  vec2 e = vec2(0.01, 0.0);
  return normalize(vec3(
    blob_noise(t, v + e.xy, s) - blob_noise(t, v - e.xy, s),
    blob_noise(t, v + e.yx, s) - blob_noise(t, v - e.yx, s),
    1.0));
}

float blob_noises(float t, vec2 p, float s) {
  float h = 0.0;
  const float n = 3.0;
  for (float i = 0.0; i < n; i++) {
    vec2 q = vec2(0.0, 1.0 * t * (i + 1.0) / n) + 1.0 * p;
    h += pow(0.5 + 0.5 * cos(PI * clamp(grid_noise(t, q * (i + 1.0)) * 2.0, 0.0, 1.0)), s);
  }
  return h / n;
}

vec3 blob_noises_normal(float t, vec2 p, float s) {
  float d = 0.01;
  return normalize(vec3(
    blob_noises(t, p + vec2(d, 0.0), s) - blob_noises(t, p + vec2(-d, 0.0), s),
    blob_noises(t, p + vec2(0.0, d), s) - blob_noises(t, p + vec2(0.0, -d), s),
    d));
}

void main() {
  float t = u_time * u_timeScale;
  vec2 p = vec2(vUv.x, 1.0 - vUv.y);
  vec2 r = vec2(1.0, u_resolution.y / u_resolution.x);
  vec3 n = blob_noises_normal(t, u_noiseScale * p * r, u_sharpness);
  vec2 uv = clamp(p + u_distortion * n.xy, vec2(0.0), vec2(1.0));
  fragColor = texture(u_sceneTex, uv);
  fragColor.a = 1.0;
}`

export class GlassOverlayManager {
  constructor (overlayCanvas, sourceProvider) {
    this.canvas = overlayCanvas
    this.sourceProvider = sourceProvider
    this.gl = null
    this.glassProgram = null
    this.rainProgram = null
    this.glassUniforms = null
    this.rainUniforms = null
    this.sceneTexture = null
    this.captureCanvas = document.createElement('canvas')
    this.captureCtx = this.captureCanvas.getContext('2d', { alpha: false, willReadFrequently: false })
    this.center = {
      x: window.innerWidth * 0.5,
      y: window.innerHeight * 0.5
    }
    this.dragState = {
      active: false,
      pointerId: null,
      offsetX: 0,
      offsetY: 0
    }
    this.handlePointerDown = this.handlePointerDown.bind(this)
    this.handlePointerMove = this.handlePointerMove.bind(this)
    this.handlePointerUp = this.handlePointerUp.bind(this)
  }

  init () {
    if (!this.canvas) return false
    const gl = this.canvas.getContext('webgl2', { alpha: true, antialias: false, premultipliedAlpha: true })
    if (!gl) return false
    this.gl = gl
    this.glassProgram = linkProgram(gl, VERTEX, FRAGMENT)
    this.rainProgram = linkProgram(gl, VERTEX, RAIN_FRAGMENT)
    if (!this.glassProgram || !this.rainProgram) return false
    this.glassUniforms = {
      u_sceneTex: gl.getUniformLocation(this.glassProgram, 'u_sceneTex'),
      u_resolution: gl.getUniformLocation(this.glassProgram, 'u_resolution'),
      u_center: gl.getUniformLocation(this.glassProgram, 'u_center'),
      u_size: gl.getUniformLocation(this.glassProgram, 'u_size'),
      u_radius: gl.getUniformLocation(this.glassProgram, 'u_radius'),
      u_bezel: gl.getUniformLocation(this.glassProgram, 'u_bezel'),
      u_thickness: gl.getUniformLocation(this.glassProgram, 'u_thickness'),
      u_ior: gl.getUniformLocation(this.glassProgram, 'u_ior'),
      u_blur: gl.getUniformLocation(this.glassProgram, 'u_blur'),
      u_specular: gl.getUniformLocation(this.glassProgram, 'u_specular'),
      u_tint: gl.getUniformLocation(this.glassProgram, 'u_tint'),
      u_shadow: gl.getUniformLocation(this.glassProgram, 'u_shadow'),
      u_mode: gl.getUniformLocation(this.glassProgram, 'u_mode'),
      u_brickSize: gl.getUniformLocation(this.glassProgram, 'u_brickSize'),
      u_brickOffset: gl.getUniformLocation(this.glassProgram, 'u_brickOffset'),
      u_brickGap: gl.getUniformLocation(this.glassProgram, 'u_brickGap')
    }
    this.rainUniforms = {
      u_sceneTex: gl.getUniformLocation(this.rainProgram, 'u_sceneTex'),
      u_resolution: gl.getUniformLocation(this.rainProgram, 'u_resolution'),
      u_time: gl.getUniformLocation(this.rainProgram, 'u_time'),
      u_distortion: gl.getUniformLocation(this.rainProgram, 'u_distortion'),
      u_noiseScale: gl.getUniformLocation(this.rainProgram, 'u_noiseScale'),
      u_timeScale: gl.getUniformLocation(this.rainProgram, 'u_timeScale'),
      u_patternDrift: gl.getUniformLocation(this.rainProgram, 'u_patternDrift'),
      u_sharpness: gl.getUniformLocation(this.rainProgram, 'u_sharpness')
    }

    this.sceneTexture = gl.createTexture()
    gl.bindTexture(gl.TEXTURE_2D, this.sceneTexture)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    gl.bindTexture(gl.TEXTURE_2D, null)

    this.resize()
    this.installPointerHandlers()
    return true
  }

  installPointerHandlers () {
    window.addEventListener('pointerdown', this.handlePointerDown, { passive: true })
    window.addEventListener('pointermove', this.handlePointerMove, { passive: true })
    window.addEventListener('pointerup', this.handlePointerUp, { passive: true })
    window.addEventListener('pointercancel', this.handlePointerUp, { passive: true })
  }

  handlePointerDown (e) {
    const c = SETTINGS.CANVAS
    if (!c.GLASS_OVERLAY_ENABLED || c.GLASS_OVERLAY_MODE !== 'single') return
    if (e.target && typeof e.target.closest === 'function' && e.target.closest('#sidePanel')) return
    const hw = Math.max(1, (c.GLASS_OVERLAY_WIDTH ?? 200) * 0.5)
    const hh = Math.max(1, (c.GLASS_OVERLAY_HEIGHT ?? 200) * 0.5)
    if (Math.abs(e.clientX - this.center.x) > hw || Math.abs(e.clientY - this.center.y) > hh) return
    this.dragState.active = true
    this.dragState.pointerId = e.pointerId
    this.dragState.offsetX = this.center.x - e.clientX
    this.dragState.offsetY = this.center.y - e.clientY
  }

  handlePointerMove (e) {
    if (!this.dragState.active || e.pointerId !== this.dragState.pointerId) return
    this.center.x = e.clientX + this.dragState.offsetX
    this.center.y = e.clientY + this.dragState.offsetY
  }

  handlePointerUp (e) {
    if (e.pointerId !== this.dragState.pointerId) return
    this.dragState.active = false
    this.dragState.pointerId = null
  }

  resize () {
    if (!this.canvas || !this.gl) return
    const w = Math.max(1, Math.floor(window.innerWidth))
    const h = Math.max(1, Math.floor(window.innerHeight))
    this.canvas.width = w
    this.canvas.height = h
    this.captureCanvas.width = w
    this.captureCanvas.height = h
    this.center.x = Math.min(Math.max(this.center.x, 0), w)
    this.center.y = Math.min(Math.max(this.center.y, 0), h)
    this.gl.viewport(0, 0, w, h)
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.sceneTexture)
    this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, w, h, 0, this.gl.RGBA, this.gl.UNSIGNED_BYTE, null)
    this.gl.bindTexture(this.gl.TEXTURE_2D, null)
  }

  captureScene () {
    if (!this.captureCtx) return false
    const w = this.captureCanvas.width
    const h = this.captureCanvas.height
    this.captureCtx.setTransform(1, 0, 0, 1, 0, 0)
    this.captureCtx.globalCompositeOperation = 'source-over'
    this.captureCtx.clearRect(0, 0, w, h)
    const sources = this.sourceProvider ? this.sourceProvider() : []
    for (const source of sources) {
      if (!source || source.width < 1 || source.height < 1) continue
      this.captureCtx.drawImage(source, 0, 0, w, h)
    }
    return true
  }

  render (timeSeconds = 0) {
    const c = SETTINGS.CANVAS
    if (!this.gl || !this.glassProgram || !this.rainProgram || !c.GLASS_OVERLAY_ENABLED) {
      if (this.canvas) this.canvas.style.display = 'none'
      return
    }
    this.canvas.style.display = 'block'
    if (!this.captureScene()) return

    const gl = this.gl
    const isRain = c.GLASS_OVERLAY_MODE === 'rain'
    const program = isRain ? this.rainProgram : this.glassProgram
    const uniforms = isRain ? this.rainUniforms : this.glassUniforms

    gl.disable(gl.DEPTH_TEST)
    gl.disable(gl.BLEND)
    gl.viewport(0, 0, this.canvas.width, this.canvas.height)
    gl.useProgram(program)

    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, this.sceneTexture)
    gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, gl.RGBA, gl.UNSIGNED_BYTE, this.captureCanvas)

    gl.uniform1i(uniforms.u_sceneTex, 0)
    gl.uniform2f(uniforms.u_resolution, this.canvas.width, this.canvas.height)

    if (isRain) {
      gl.uniform1f(uniforms.u_time, timeSeconds)
      gl.uniform1f(uniforms.u_distortion, c.SHADER_OVERLAY_RAIN_DISTORTION ?? 0.05)
      gl.uniform1f(uniforms.u_noiseScale, c.SHADER_OVERLAY_RAIN_SCALE ?? 25.0)
      gl.uniform1f(uniforms.u_timeScale, c.SHADER_OVERLAY_RAIN_TIME_SCALE ?? 1.0)
      gl.uniform1f(uniforms.u_patternDrift, c.SHADER_OVERLAY_RAIN_PATTERN_DRIFT ?? 0.1)
      gl.uniform1f(uniforms.u_sharpness, c.SHADER_OVERLAY_RAIN_SHARPNESS ?? 1.0)
    } else {
      gl.uniform2f(uniforms.u_center, this.center.x, this.center.y)
      gl.uniform2f(uniforms.u_size, c.GLASS_OVERLAY_WIDTH ?? 200, c.GLASS_OVERLAY_HEIGHT ?? 200)
      gl.uniform1f(uniforms.u_radius, c.GLASS_OVERLAY_RADIUS ?? 27)
      gl.uniform1f(uniforms.u_bezel, c.GLASS_OVERLAY_BEZEL ?? 60)
      gl.uniform1f(uniforms.u_thickness, c.GLASS_OVERLAY_THICKNESS ?? 200)
      gl.uniform1f(uniforms.u_ior, c.GLASS_OVERLAY_IOR ?? 3.0)
      gl.uniform1f(uniforms.u_blur, c.GLASS_OVERLAY_BLUR ?? 9.5)
      gl.uniform1f(uniforms.u_specular, c.GLASS_OVERLAY_SPECULAR ?? 0.35)
      gl.uniform1f(uniforms.u_tint, c.GLASS_OVERLAY_TINT ?? 0)
      gl.uniform1f(uniforms.u_shadow, c.GLASS_OVERLAY_SHADOW ?? 0.0)
      gl.uniform1i(uniforms.u_mode, c.GLASS_OVERLAY_MODE === 'bricks' ? 1 : 0)
      gl.uniform2f(uniforms.u_brickSize, c.GLASS_OVERLAY_BRICK_SIZE ?? 200, c.GLASS_OVERLAY_BRICK_SIZE ?? 200)
      gl.uniform2f(uniforms.u_brickOffset, c.GLASS_OVERLAY_BRICK_OFFSET_X ?? 0, c.GLASS_OVERLAY_BRICK_OFFSET_Y ?? 0)
      gl.uniform1f(uniforms.u_brickGap, c.GLASS_OVERLAY_BRICK_GAP ?? 8)
    }

    gl.drawArrays(gl.TRIANGLES, 0, 3)
    gl.bindTexture(gl.TEXTURE_2D, null)
  }

  dispose () {
    window.removeEventListener('pointerdown', this.handlePointerDown)
    window.removeEventListener('pointermove', this.handlePointerMove)
    window.removeEventListener('pointerup', this.handlePointerUp)
    window.removeEventListener('pointercancel', this.handlePointerUp)
    if (this.gl && this.sceneTexture) this.gl.deleteTexture(this.sceneTexture)
    if (this.gl && this.glassProgram) this.gl.deleteProgram(this.glassProgram)
    if (this.gl && this.rainProgram) this.gl.deleteProgram(this.rainProgram)
    this.sceneTexture = null
    this.glassProgram = null
    this.rainProgram = null
    this.gl = null
  }
}
