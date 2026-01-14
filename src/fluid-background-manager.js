import { SETTINGS } from './settings.js'

export class FluidBackgroundManager {
  constructor (canvas) {
    this.canvas = canvas
    this.composer = null
    this.enabled = false
    this.renderMode = 'Fluid'
    this.trailLength = 15
    this.colorFluidBackground = { r: 0.02, g: 0.078, b: 0.157 }
    this.colorFluidTrail = { r: 0.821, g: 0.898, b: 0.941 }
    this.colorPressure = { r: 0.02, g: 0.078, b: 0.157 }
    this.colorVelocity = { r: 0.741, g: 0.773, b: 0.816 }
    this.cursorMode = true
    this.lastPointMode = false
    this.lastLuminodePosition = null
    
    this.velocityState = null
    this.divergenceState = null
    this.pressureState = null
    this.particlePositionState = null
    this.particleInitialState = null
    this.particleAgeState = null
    this.trailState = null
    
    this.programs = {}
    this.activeTouches = {}
    this.eventHandlers = {}
    
    this.TOUCH_FORCE_SCALE = 2
    this.PARTICLE_DENSITY = 0.1
    this.MAX_NUM_PARTICLES = 100000
    this.PARTICLE_LIFETIME = 1000
    this.NUM_JACOBI_STEPS = 3
    this.PRESSURE_CALC_ALPHA = -1
    this.PRESSURE_CALC_BETA = 0.25
    this.NUM_RENDER_STEPS = 3
    this.VELOCITY_SCALE_FACTOR = 8
    this.MAX_VELOCITY = 30
    this.POSITION_NUM_COMPONENTS = 4
    
    this.NUM_PARTICLES = 0
  }

  init () {
    if (!window.GPUIO) {
      console.error('GPU-io library not loaded')
      return false
    }

    const {
      GPUComposer,
      GPUProgram,
      GPULayer,
      SHORT,
      INT,
      FLOAT,
      REPEAT,
      NEAREST,
      LINEAR,
      renderSignedAmplitudeProgram
    } = window.GPUIO

    this.composer = new GPUComposer({ canvas: this.canvas })
    
    const width = this.canvas.width
    const height = this.canvas.height
    this.NUM_PARTICLES = this.calcNumParticles(width, height)

    const velocityDimensions = [
      Math.ceil(width / this.VELOCITY_SCALE_FACTOR),
      Math.ceil(height / this.VELOCITY_SCALE_FACTOR)
    ]

    this.velocityState = new GPULayer(this.composer, {
      name: 'velocity',
      dimensions: velocityDimensions,
      type: FLOAT,
      filter: LINEAR,
      numComponents: 2,
      wrapX: REPEAT,
      wrapY: REPEAT,
      numBuffers: 2
    })

    this.divergenceState = new GPULayer(this.composer, {
      name: 'divergence',
      dimensions: velocityDimensions,
      type: FLOAT,
      filter: NEAREST,
      numComponents: 1,
      wrapX: REPEAT,
      wrapY: REPEAT
    })

    this.pressureState = new GPULayer(this.composer, {
      name: 'pressure',
      dimensions: velocityDimensions,
      type: FLOAT,
      filter: NEAREST,
      numComponents: 1,
      wrapX: REPEAT,
      wrapY: REPEAT,
      numBuffers: 2
    })

    this.particlePositionState = new GPULayer(this.composer, {
      name: 'position',
      dimensions: this.NUM_PARTICLES,
      type: FLOAT,
      numComponents: this.POSITION_NUM_COMPONENTS,
      numBuffers: 2
    })

    this.particleInitialState = new GPULayer(this.composer, {
      name: 'initialPosition',
      dimensions: this.NUM_PARTICLES,
      type: FLOAT,
      numComponents: this.POSITION_NUM_COMPONENTS,
      numBuffers: 1
    })

    this.particleAgeState = new GPULayer(this.composer, {
      name: 'age',
      dimensions: this.NUM_PARTICLES,
      type: SHORT,
      numComponents: 1,
      numBuffers: 2
    })

    this.trailState = new GPULayer(this.composer, {
      name: 'trails',
      dimensions: [width, height],
      type: FLOAT,
      filter: NEAREST,
      numComponents: 1,
      numBuffers: 2
    })

    this.initPrograms()
    this.initParticles()
    this.setupEventListeners()

    return true
  }

  calcNumParticles (width, height) {
    return Math.min(
      Math.ceil(width * height * this.PARTICLE_DENSITY),
      this.MAX_NUM_PARTICLES
    )
  }

  initPrograms () {
    const {
      GPUProgram,
      INT,
      FLOAT,
      renderSignedAmplitudeProgram
    } = window.GPUIO

    const width = this.canvas.width
    const height = this.canvas.height
    const velocityDimensions = [
      Math.ceil(width / this.VELOCITY_SCALE_FACTOR),
      Math.ceil(height / this.VELOCITY_SCALE_FACTOR)
    ]

    this.programs.advection = new GPUProgram(this.composer, {
      name: 'advection',
      fragmentShader: `
        in vec2 v_uv;
        uniform sampler2D u_state;
        uniform sampler2D u_velocity;
        uniform vec2 u_dimensions;
        out vec2 out_state;
        void main() {
          out_state = texture(u_state, v_uv - texture(u_velocity, v_uv).xy / u_dimensions).xy;
        }
      `,
      uniforms: [
        { name: 'u_state', value: 0, type: INT },
        { name: 'u_velocity', value: 1, type: INT },
        { name: 'u_dimensions', value: [width, height], type: FLOAT }
      ]
    })

    this.programs.divergence2D = new GPUProgram(this.composer, {
      name: 'divergence2D',
      fragmentShader: `
        in vec2 v_uv;
        uniform sampler2D u_vectorField;
        uniform vec2 u_pxSize;
        out float out_divergence;
        void main() {
          float n = texture(u_vectorField, v_uv + vec2(0, u_pxSize.y)).y;
          float s = texture(u_vectorField, v_uv - vec2(0, u_pxSize.y)).y;
          float e = texture(u_vectorField, v_uv + vec2(u_pxSize.x, 0)).x;
          float w = texture(u_vectorField, v_uv - vec2(u_pxSize.x, 0)).x;
          out_divergence = 0.5 * (e - w + n - s);
        }
      `,
      uniforms: [
        { name: 'u_vectorField', value: 0, type: INT },
        { name: 'u_pxSize', value: [1 / this.velocityState.width, 1 / this.velocityState.height], type: FLOAT }
      ]
    })

    this.programs.jacobi = new GPUProgram(this.composer, {
      name: 'jacobi',
      fragmentShader: `
        in vec2 v_uv;
        uniform float u_alpha;
        uniform float u_beta;
        uniform vec2 u_pxSize;
        uniform sampler2D u_previousState;
        uniform sampler2D u_divergence;
        out vec4 out_jacobi;
        void main() {
          vec4 n = texture(u_previousState, v_uv + vec2(0, u_pxSize.y));
          vec4 s = texture(u_previousState, v_uv - vec2(0, u_pxSize.y));
          vec4 e = texture(u_previousState, v_uv + vec2(u_pxSize.x, 0));
          vec4 w = texture(u_previousState, v_uv - vec2(u_pxSize.x, 0));
          vec4 d = texture(u_divergence, v_uv);
          out_jacobi = (n + s + e + w + u_alpha * d) * u_beta;
        }
      `,
      uniforms: [
        { name: 'u_alpha', value: this.PRESSURE_CALC_ALPHA, type: FLOAT },
        { name: 'u_beta', value: this.PRESSURE_CALC_BETA, type: FLOAT },
        { name: 'u_pxSize', value: [1 / velocityDimensions[0], 1 / velocityDimensions[1]], type: FLOAT },
        { name: 'u_previousState', value: 0, type: INT },
        { name: 'u_divergence', value: 1, type: INT }
      ]
    })

    this.programs.gradientSubtraction = new GPUProgram(this.composer, {
      name: 'gradientSubtraction',
      fragmentShader: `
        in vec2 v_uv;
        uniform vec2 u_pxSize;
        uniform sampler2D u_scalarField;
        uniform sampler2D u_vectorField;
        out vec2 out_result;
        void main() {
          float n = texture(u_scalarField, v_uv + vec2(0, u_pxSize.y)).r;
          float s = texture(u_scalarField, v_uv - vec2(0, u_pxSize.y)).r;
          float e = texture(u_scalarField, v_uv + vec2(u_pxSize.x, 0)).r;
          float w = texture(u_scalarField, v_uv - vec2(u_pxSize.x, 0)).r;
          out_result = texture(u_vectorField, v_uv).xy - 0.5 * vec2(e - w, n - s);
        }
      `,
      uniforms: [
        { name: 'u_pxSize', value: [1 / velocityDimensions[0], 1 / velocityDimensions[1]], type: FLOAT },
        { name: 'u_scalarField', value: 0, type: INT },
        { name: 'u_vectorField', value: 1, type: INT }
      ]
    })

    this.programs.renderParticles = new GPUProgram(this.composer, {
      name: 'renderParticles',
      fragmentShader: `
        in vec2 v_uv;
        in vec2 v_uv_position;
        uniform isampler2D u_ages;
        uniform sampler2D u_velocity;
        out float out_state;
        void main() {
          float ageFraction = float(texture(u_ages, v_uv_position).x) / ${this.PARTICLE_LIFETIME.toFixed(1)};
          float opacity = mix(0.0, 1.0, min(ageFraction * 10.0, 1.0)) * mix(1.0, 0.0, max(ageFraction * 10.0 - 90.0, 0.0));
          vec2 velocity = texture(u_velocity, v_uv).xy;
          float multiplier = clamp(dot(velocity, velocity) * 0.05 + 0.7, 0.0, 1.0);
          out_state = opacity * multiplier;
        }
      `,
      uniforms: [
        { name: 'u_ages', value: 0, type: INT },
        { name: 'u_velocity', value: 1, type: INT }
      ]
    })

    this.programs.ageParticles = new GPUProgram(this.composer, {
      name: 'ageParticles',
      fragmentShader: `
        in vec2 v_uv;
        uniform isampler2D u_ages;
        out int out_age;
        void main() {
          int age = texture(u_ages, v_uv).x + 1;
          out_age = stepi(age, ${this.PARTICLE_LIFETIME}) * age;
        }
      `,
      uniforms: [
        { name: 'u_ages', value: 0, type: INT }
      ]
    })

    this.programs.advectParticles = new GPUProgram(this.composer, {
      name: 'advectParticles',
      fragmentShader: `
        in vec2 v_uv;
        uniform vec2 u_dimensions;
        uniform sampler2D u_positions;
        uniform sampler2D u_velocity;
        uniform isampler2D u_ages;
        uniform sampler2D u_initialPositions;
        out vec4 out_position;
        void main() {
          vec4 positionData = texture(u_positions, v_uv);
          vec2 absolute = positionData.rg;
          vec2 displacement = positionData.ba;
          vec2 position = absolute + displacement;
          vec2 pxSize = 1.0 / u_dimensions;
          vec2 velocity1 = texture(u_velocity, position * pxSize).xy;
          vec2 halfStep = position + velocity1 * 0.5 * ${1 / this.NUM_RENDER_STEPS};
          vec2 velocity2 = texture(u_velocity, halfStep * pxSize).xy;
          displacement += velocity2 * ${1 / this.NUM_RENDER_STEPS};
          float shouldMerge = step(20.0, dot(displacement, displacement));
          absolute = mod(absolute + shouldMerge * displacement + u_dimensions, u_dimensions);
          displacement *= (1.0 - shouldMerge);
          int shouldReset = stepi(texture(u_ages, v_uv).x, 1);
          out_position = mix(vec4(absolute, displacement), texture(u_initialPositions, v_uv), float(shouldReset));
        }
      `,
      uniforms: [
        { name: 'u_positions', value: 0, type: INT },
        { name: 'u_velocity', value: 1, type: INT },
        { name: 'u_ages', value: 2, type: INT },
        { name: 'u_initialPositions', value: 3, type: INT },
        { name: 'u_dimensions', value: [width, height], type: FLOAT }
      ]
    })

    this.programs.fadeTrails = new GPUProgram(this.composer, {
      name: 'fadeTrails',
      fragmentShader: `
        in vec2 v_uv;
        uniform sampler2D u_image;
        uniform float u_increment;
        out float out_color;
        void main() {
          out_color = max(texture(u_image, v_uv).x + u_increment, 0.0);
        }
      `,
      uniforms: [
        { name: 'u_image', value: 0, type: INT },
        { name: 'u_increment', value: -1 / this.trailLength, type: FLOAT }
      ]
    })

    this.programs.renderTrails = new GPUProgram(this.composer, {
      name: 'renderTrails',
      fragmentShader: `
        in vec2 v_uv;
        uniform sampler2D u_trailState;
        uniform vec3 u_backgroundColor;
        uniform vec3 u_trailColor;
        out vec4 out_color;
        void main() {
          float trailValue = texture(u_trailState, v_uv).x;
          out_color = vec4(mix(u_backgroundColor, u_trailColor, trailValue), 1);
        }
      `,
      uniforms: [
        { name: 'u_trailState', value: 0, type: INT },
        { name: 'u_backgroundColor', value: [this.colorFluidBackground.r, this.colorFluidBackground.g, this.colorFluidBackground.b], type: FLOAT },
        { name: 'u_trailColor', value: [this.colorFluidTrail.r, this.colorFluidTrail.g, this.colorFluidTrail.b], type: FLOAT }
      ]
    })

    this.programs.renderPressure = new GPUProgram(this.composer, {
      name: 'renderPressure',
      fragmentShader: `
        in vec2 v_uv;
        uniform sampler2D u_pressure;
        uniform vec3 u_color;
        out vec4 out_color;
        void main() {
          float pressure = texture(u_pressure, v_uv).x;
          float normalized = (pressure + 0.5) * 0.5;
          out_color = vec4(mix(u_color, vec3(1.0), normalized), 1.0);
        }
      `,
      uniforms: [
        { name: 'u_pressure', value: 0, type: INT },
        { name: 'u_color', value: [this.colorPressure.r, this.colorPressure.g, this.colorPressure.b], type: FLOAT }
      ]
    })

    this.programs.touch = new GPUProgram(this.composer, {
      name: 'touch',
      fragmentShader: `
        in vec2 v_uv;
        in vec2 v_uv_local;
        uniform sampler2D u_velocity;
        uniform vec2 u_vector;
        out vec2 out_velocity;
        void main() {
          vec2 radialVec = (v_uv_local * 2.0 - 1.0);
          float radiusSq = dot(radialVec, radialVec);
          vec2 velocity = texture(u_velocity, v_uv).xy + (1.0 - radiusSq) * u_vector * ${this.TOUCH_FORCE_SCALE.toFixed(1)};
          float velocityMag = length(velocity);
          out_velocity = velocity / velocityMag * min(velocityMag, ${this.MAX_VELOCITY.toFixed(1)});
        }
      `,
      uniforms: [
        { name: 'u_velocity', value: 0, type: INT },
        { name: 'u_vector', value: [0, 0], type: FLOAT }
      ]
    })
  }

  initParticles () {
    const width = this.canvas.width
    const height = this.canvas.height
    const positions = new Float32Array(this.NUM_PARTICLES * this.POSITION_NUM_COMPONENTS)
    
    for (let i = 0; i < positions.length / this.POSITION_NUM_COMPONENTS; i++) {
      positions[this.POSITION_NUM_COMPONENTS * i] = Math.random() * width
      positions[this.POSITION_NUM_COMPONENTS * i + 1] = Math.random() * height
    }
    
    this.particlePositionState.resize(this.NUM_PARTICLES, positions)
    this.particleInitialState.resize(this.NUM_PARTICLES, positions)
    
    const ages = new Int16Array(this.NUM_PARTICLES)
    for (let i = 0; i < this.NUM_PARTICLES; i++) {
      ages[i] = Math.round(Math.random() * this.PARTICLE_LIFETIME)
    }
    this.particleAgeState.resize(this.NUM_PARTICLES, ages)
  }

  setupEventListeners () {
    this.removeEventListeners()
    
    if (this.cursorMode) {
      this.eventHandlers.pointermove = (e) => this.onPointerMove(e)
      this.eventHandlers.pointerup = (e) => this.onPointerStop(e)
      this.eventHandlers.pointerout = (e) => this.onPointerStop(e)
      this.eventHandlers.pointercancel = (e) => this.onPointerStop(e)
      
      window.addEventListener('pointermove', this.eventHandlers.pointermove)
      window.addEventListener('pointerup', this.eventHandlers.pointerup)
      window.addEventListener('pointerout', this.eventHandlers.pointerout)
      window.addEventListener('pointercancel', this.eventHandlers.pointercancel)
    }
  }

  removeEventListeners () {
    if (this.eventHandlers.pointermove) {
      window.removeEventListener('pointermove', this.eventHandlers.pointermove)
      window.removeEventListener('pointerup', this.eventHandlers.pointerup)
      window.removeEventListener('pointerout', this.eventHandlers.pointerout)
      window.removeEventListener('pointercancel', this.eventHandlers.pointercancel)
      this.eventHandlers = {}
    }
  }

  onPointerMove (e) {
    if (!this.cursorMode || !this.composer) return
    
    const rect = this.canvas.getBoundingClientRect()
    const scaleX = this.canvas.width / rect.width
    const scaleY = this.canvas.height / rect.height
    
    const canvasX = (e.clientX - rect.left) * scaleX
    const canvasY = (e.clientY - rect.top) * scaleY
    
    if (this.activeTouches[e.pointerId] === undefined) {
      this.activeTouches[e.pointerId] = { current: [canvasX, canvasY] }
      return
    }
    
    this.activeTouches[e.pointerId].last = this.activeTouches[e.pointerId].current
    this.activeTouches[e.pointerId].current = [canvasX, canvasY]
    
    const { current, last } = this.activeTouches[e.pointerId]
    if (current[0] === last[0] && current[1] === last[1]) return
    
    this.programs.touch.setUniform('u_vector', [
      current[0] - last[0],
      -(current[1] - last[1])
    ])
    
    this.composer.stepSegment({
      program: this.programs.touch,
      input: this.velocityState,
      output: this.velocityState,
      position1: [current[0], this.canvas.height - current[1]],
      position2: [last[0], this.canvas.height - last[1]],
      thickness: 30,
      endCaps: true
    })
  }

  onPointerStop (e) {
    delete this.activeTouches[e.pointerId]
  }

  updateLastLuminodePosition (x, y) {
    if (this.lastPointMode) {
      this.lastLuminodePosition = { x, y }
    }
  }

  applyLastPointTouch () {
    if (!this.lastPointMode || !this.lastLuminodePosition) return
    
    const current = [this.lastLuminodePosition.x, this.lastLuminodePosition.y]
    const last = this.lastLuminodePosition.last || current
    
    this.programs.touch.setUniform('u_vector', [
      current[0] - last[0],
      -(current[1] - last[1])
    ])
    
    this.composer.stepSegment({
      program: this.programs.touch,
      input: this.velocityState,
      output: this.velocityState,
      position1: [current[0], this.canvas.clientHeight - current[1]],
      position2: [last[0], this.canvas.clientHeight - last[1]],
      thickness: 30,
      endCaps: true
    })
    
    this.lastLuminodePosition.last = current
  }

  update () {
    if (!this.enabled || !this.composer) return

    this.composer.step({
      program: this.programs.advection,
      input: [this.velocityState, this.velocityState],
      output: this.velocityState
    })

    this.composer.step({
      program: this.programs.divergence2D,
      input: this.velocityState,
      output: this.divergenceState
    })

    for (let i = 0; i < this.NUM_JACOBI_STEPS; i++) {
      this.composer.step({
        program: this.programs.jacobi,
        input: [this.pressureState, this.divergenceState],
        output: this.pressureState
      })
    }

    this.composer.step({
      program: this.programs.gradientSubtraction,
      input: [this.pressureState, this.velocityState],
      output: this.velocityState
    })

    if (this.lastPointMode) {
      this.applyLastPointTouch()
    }

    if (this.renderMode === 'Pressure') {
      this.programs.renderPressure.setUniform('u_color', [
        this.colorPressure.r,
        this.colorPressure.g,
        this.colorPressure.b
      ])
      this.composer.step({
        program: this.programs.renderPressure,
        input: this.pressureState
      })
    } else if (this.renderMode === 'Velocity') {
      this.composer.drawLayerAsVectorField({
        layer: this.velocityState,
        vectorSpacing: 10,
        vectorScale: 2.5,
        color: [this.colorVelocity.r, this.colorVelocity.g, this.colorVelocity.b]
      })
    } else {
      this.composer.step({
        program: this.programs.ageParticles,
        input: this.particleAgeState,
        output: this.particleAgeState
      })

      this.composer.step({
        program: this.programs.fadeTrails,
        input: this.trailState,
        output: this.trailState
      })

      for (let i = 0; i < this.NUM_RENDER_STEPS; i++) {
        this.composer.step({
          program: this.programs.advectParticles,
          input: [
            this.particlePositionState,
            this.velocityState,
            this.particleAgeState,
            this.particleInitialState
          ],
          output: this.particlePositionState
        })

        this.composer.drawLayerAsPoints({
          layer: this.particlePositionState,
          program: this.programs.renderParticles,
          input: [this.particleAgeState, this.velocityState],
          output: this.trailState,
          wrapX: true,
          wrapY: true
        })
      }

      this.programs.renderTrails.setUniform('u_backgroundColor', [
        this.colorFluidBackground.r,
        this.colorFluidBackground.g,
        this.colorFluidBackground.b
      ])
      this.programs.renderTrails.setUniform('u_trailColor', [
        this.colorFluidTrail.r,
        this.colorFluidTrail.g,
        this.colorFluidTrail.b
      ])

      this.composer.step({
        program: this.programs.renderTrails,
        input: this.trailState
      })
    }
  }

  setEnabled (enabled) {
    this.enabled = enabled
  }

  setRenderMode (mode) {
    this.renderMode = mode
  }

  setTrailLength (length) {
    this.trailLength = length
    if (this.programs.fadeTrails) {
      this.programs.fadeTrails.setUniform('u_increment', -1 / length)
    }
  }

  setColorFluidBackground (r, g, b) {
    this.colorFluidBackground = { r, g, b }
  }

  setColorFluidTrail (r, g, b) {
    this.colorFluidTrail = { r, g, b }
  }

  setColorPressure (r, g, b) {
    this.colorPressure = { r, g, b }
  }

  setColorVelocity (r, g, b) {
    this.colorVelocity = { r, g, b }
  }

  setCursorMode (enabled) {
    this.cursorMode = enabled
    this.lastPointMode = !enabled
    this.setupEventListeners()
  }

  setLastPointMode (enabled) {
    this.lastPointMode = enabled
    this.cursorMode = !enabled
    this.setupEventListeners()
  }

  resize () {
    if (!this.composer) return

    const width = this.canvas.width
    const height = this.canvas.height

    this.composer.resize([width, height])

    const velocityDimensions = [
      Math.ceil(width / this.VELOCITY_SCALE_FACTOR),
      Math.ceil(height / this.VELOCITY_SCALE_FACTOR)
    ]

    this.velocityState.resize(velocityDimensions)
    this.divergenceState.resize(velocityDimensions)
    this.pressureState.resize(velocityDimensions)
    this.trailState.resize([width, height])

    this.programs.advection.setUniform('u_dimensions', [width, height])
    this.programs.advectParticles.setUniform('u_dimensions', [width, height])

    const velocityPxSize = [1 / velocityDimensions[0], 1 / velocityDimensions[1]]
    this.programs.divergence2D.setUniform('u_pxSize', velocityPxSize)
    this.programs.jacobi.setUniform('u_pxSize', velocityPxSize)
    this.programs.gradientSubtraction.setUniform('u_pxSize', velocityPxSize)

    this.NUM_PARTICLES = this.calcNumParticles(width, height)
    this.initParticles()
  }

  dispose () {
    this.removeEventListeners()
    
    if (this.composer) {
      Object.values(this.programs).forEach(program => {
        if (program && program.dispose) program.dispose()
      })
      
      if (this.velocityState) this.velocityState.dispose()
      if (this.divergenceState) this.divergenceState.dispose()
      if (this.pressureState) this.pressureState.dispose()
      if (this.particlePositionState) this.particlePositionState.dispose()
      if (this.particleInitialState) this.particleInitialState.dispose()
      if (this.particleAgeState) this.particleAgeState.dispose()
      if (this.trailState) this.trailState.dispose()
      
      this.composer.dispose()
    }
  }
}
