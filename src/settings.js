// Settings and configuration constants
export const SETTINGS = {
  // Canvas settings
  CANVAS: {
    CLEAR_ALPHA: 0.4,
    BACKGROUND_COLOR: '#000',
    CRT_MODE: false,
    CRT_INTENSITY: 100,
    LUMIA_EFFECT: 0,
    GRID_ENABLED: false,
    GRID_X_LINES: 10,
    GRID_Y_LINES: 10,
    GRID_COLOR: '#333333',
    NOISE_OVERLAY: false,
    NOISE_ANIMATE: true,
    NOISE_PATTERN_WIDTH: 100,
    NOISE_PATTERN_HEIGHT: 100,
    NOISE_OPACITY: 0.05,
    NOISE_DENSITY: 1,
    NOISE_WIDTH: 1,
    NOISE_HEIGHT: 1,
    DITHER_OVERLAY: false,
    DITHER_SATURATE: 1,
    DITHER_TABLE_VALUES_R: '0 1',
    DITHER_TABLE_VALUES_G: '0 1',
    DITHER_TABLE_VALUES_B: '0 1',
    CHROMATIC_ABERRATION_ENABLED: false,
    CHROMATIC_ABERRATION_CONTRAST: 1,
    INVERT_FILTER: 0,
    SHADER_BACKGROUND_ENABLED: false,
    SHADER_BACKGROUND_MODE: 'Fluid',
    SHADER_BACKGROUND_TRAIL_LENGTH: 15,
    SHADER_BACKGROUND_COLOR_FLUID_BACKGROUND: { r: 0.02, g: 0.078, b: 0.157 },
    SHADER_BACKGROUND_COLOR_FLUID_TRAIL: { r: 0, g: 0, b: 0.2 },
    SHADER_BACKGROUND_COLOR_PRESSURE: { r: 0.02, g: 0.078, b: 0.157 },
    SHADER_BACKGROUND_COLOR_VELOCITY: { r: 0.259, g: 0.227, b: 0.184 },
    SHADER_BACKGROUND_CURSOR_MODE: true
  },

  // MIDI settings
  MIDI: {
    NOTE_ON: 0x90,
    NOTE_OFF: 0x80,
    CONTROL_CHANGE: 0xB0,
    VELOCITY_MAX: 127
  },

  HARDWARE_MODE: {
    ENABLED: false 
  },

  // Color settings
  COLORS: {
    SOTO_PALETTE: [
      '#EF4136', // Red-orange
      '#005BBB', // Blue
      '#FCEE09', // Yellow
      '#2E7D32', // Green
      '#FFFFFF', // White
      '#4A148C', // Purple
      '#8B0000' // Dark red
    ],
    POLYGON_COLORS: ['#f93822', '#fcdc4d', '#00a6a6', '#90be6d', '#f94144', '#ff006e', '#8338ec']
  },

  // Drawing modules configuration
  MODULES: {
    LISSAJOUS: {
      SCALE: 250,
      ROTATION_SPEED: 0.1,
      LINE_WIDTH: 1,
      SHADOW_BLUR: 25
    },
    HARMONOGRAPH: {
      BASE_AMPLITUDE: 100,
      AMPLITUDE_VARIATION: 50,
      VELOCITY_SCALE: 1.5,
      ITERATIONS: 3000,
      TIME_STEP: 0.002,
      SHADOW_BLUR: 25
    },
    SPHERE: {
      BASE_RADIUS: 160,
      LAT_LINES: 12,
      LON_LINES: 20,
      DEFORM_FACTOR: 1.2,
      LINE_WIDTH: 0.8,
      USE_COLOR: false
    },
    GEGO_NET: {
      BASE_NODES: 5,
      NODES_PER_NOTE: 15,
      CONNECTION_DISTANCE: 0.7,
      MAX_CONNECTIONS: 5
    },
    GEGO_SHAPE: {
      BASE_NODES: 4,
      NODES_PER_NOTE: 2,
      BASE_SIZE: 240,
      CONNECTION_PROBABILITY: 0.3
    },
    SOTO_GRID: {
      BASE_SIZE: 80,
      VELOCITY_MULTIPLIER: 5,
      STRIPE_WIDTH: 3,
      SOLID_HEIGHT_RATIO: 0.2
    },
    MOIRE_CIRCLES: {
      BASE_COUNT: 8,
      SPACING: 35,
      SPEED: 0.0015
    },
    PHYLLOTAXIS: {
      GOLDEN_ANGLE: Math.PI * (3 - Math.sqrt(5)),
      SCALE: 12,
      BASE_SIZE: 3,
      MAX_SIZE: 9,
      ROTATION_SPEED: 0.15,
      DOTS_PER_NOTE: 20
    },
    WOVEN_NET: {
      BASE_GRID_SIZE: 5,
      GRID_SIZE_PER_NOTE: 2,
      SPACING: 30,
      BASE_SIZE: 20,
      SIZE_VARIATION: 15
    },
    POLYGONS: {
      BASE_LAYERS: 2,
      MAX_LAYERS: 3,
      MAX_SIZE: 220,
      SPACING: 40,
      LAYER_OFFSET: 12,
      JITTER_BASE: 4,
      JITTER_INCREMENT: 1.5,
      BASE_SIDES: 6,
      SIDES_VARIATION: 3
    },
    WHITNEY_LINES: {
      RADIUS: 250,
      LINES_PER_NOTE: 10,
      ROTATION_SPEED: 0.5,
      LINE_WIDTH: 0.8,
      SHADOW_BLUR: 15,
      USE_COLOR: false
    },
    SINEWAVE: {
      AMPLITUDE: 100,
      FREQUENCY: 1,
      PHASE_SPEED: 0.5,
      LINE_WIDTH: 1.5
    },
    TRIANGLE: {
      SIZE: 100,
      ROTATION_SPEED: 0.8,
      LINE_WIDTH: 1.2,
      OPACITY: 0.7
    },
    NOISE_VALLEY: {
      SIZE: 0.8,
      DENSITY: 40,
      ROTATION_SPEED: 0.3,
      DEFORMATION_STRENGTH: 0.5,
      LINE_WIDTH: 0.8,
      BASE_HUE: 0,
      USE_COLOR: false,
      HEIGHT_SCALE: 30,
      PERSPECTIVE: 0.6
    },
    CATENOID: {
      RADIUS: 80,
      HEIGHT: 300,
      RINGS: 16,
      SEGMENTS: 24,
      SCALE: 1.0,
      ROTATION_SPEED: 0.3,
      DEFORMATION_STRENGTH: 0.5,
      LINE_WIDTH: 0.8,
      BASE_HUE: 0,
      USE_COLOR: false
    },
    LINE_CYLINDER: {
      RADIUS: 100,
      HEIGHT: 300,
      LINES_PER_NOTE: 8,
      SCALE: 1.5,
      ROTATION_SPEED: 0.3,
      ANIMATION_SPEED: 0.5,
      SEPARATION_THRESHOLD: 0.1,
      DEFORMATION_STRENGTH: 0.4,
      LINE_WIDTH: 0.8,
      BASE_HUE: 0,
      USE_COLOR: false
    },
    CLAVILUX: {
      BASE_SIZE: 120,
      SIZE_VARIATION: 80,
      CENTER_AREA: 300,
      FLOAT_SPEED: 0.1,
      FADE_DURATION: 5000,
      MAX_FORMS: 20
    },
    DIAMOND: {
      RADIUS: 80,
      HEIGHT: 200,
      RINGS: 8,
      SEGMENTS: 36,
      INSTANCES: 2,
      RADIAL_SPACING: 140,
      INSTANCE_DISTANCE: 1.0, // Distance multiplier between instances
      SCALE: 1.0,
      ROTATION_SPEED: 0.3,
      DEFORMATION_STRENGTH: 0.5,
      LINE_WIDTH: 0.8,
      BASE_HUE: 0,
      USE_COLOR: false
    },
    CUBE: {
      SIZE: 150,
      SEGMENTS: 5,
      SCALE: 1.0,
      ROTATION_SPEED: 0.3,
      LINE_WIDTH: 0.8,
      BASE_HUE: 0,
      USE_COLOR: false
    },
    TREFOIL: {
      SCALE: 95,
      NUM_LACES: 3,
      NODE_MODE: true,
      SCALE_VARIATION: 0.5,
      SEGMENTS: 150,
      ROTATION_SPEED: 0.3,
      DEFORMATION_STRENGTH: 0.5,
      LINE_WIDTH: 1.5,
      BASE_HUE: 0,
      USE_COLOR: true
    },
    SPHERICAL_LENS: {
      RADIUS: 200,
      LINES_PER_NOTE: 8,
      LINE_WIDTH: 1.0,
      LINE_COLOR: 'rgba(255, 255, 255, 0.6)',
      LENS_WIDTH: 1.5,
      SHADOW_BLUR: 10,
      ROTATION_SPEED: 0.1,
      SHOW_POINT_SOURCE: false,
      USE_COLOR: false,
      ABERRATION_STRENGTH: 1.0,
      CHROMATIC_ABERRATION: 0,
      ORIENTATION: 'horizontal',
      LINE_LENGTH: 0,
      CENTER_X: 0,
      CENTER_Y: 0,
      WAVE_SPEED: 0.3,
      WAVE_AMPLITUDE: 5,
      LENS_DEPTH: 0.3
    },
    EPITROCHOID: {
      BASE_SIZE: 250,
      GROWTH_RATE: 0.2,
      ROTATION_SPEED: 0.3,
      SEGMENTS: 200,
      LINES_PER_NOTE: 1,
      DEPTH_PROJECTION: 0.2,
      LINE_WIDTH: 1,
      SHADOW_BLUR: 15,
      USE_3D_ROTATION: true,
      USE_COLOR: false
    },
    SYNC_HELIX_2D: {
      SEGMENTS: 40,
      AMPLITUDE: 200,
      FREQUENCY: 2.2,
      RADIUS: 81,
      CROSS_SECTION_POINTS: 10,
      SCALE: 1.0,
      LINE_WIDTH: 1.2,
      ANIMATION_SPEED: 0.5,
      SYNC_RATE: 0.7,
      PERSPECTIVE: 0.2,
      ENABLE_PROJECTION: true,
      USE_COLOR: false
    },
    DE_JONG: {
      // De Jong attractor parameters
      A: -1.5090717287003517,
      B: -2.0,
      C: -1.2,
      D: 2.0,
      // Rendering parameters
      SCALE: 0.9,
      ITERATIONS: 50000,
      POINT_SIZE: 1.5,
      COLOR_MODE: 0 // 0 = rainbow, 1 = MIDI, 2 = black & white
    },
    RAMIEL: {
      SIZE: 300,
      SCALE: 1.0,
      INSTANCES: 1,
      INSTANCE_SPACING: 200,
      INSTANCE_PER_NOTE: false,
      ENABLE_ROTATION: true,
      ROTATION_SPEED: 0.3,
      PERSPECTIVE: 0.2,
      ENABLE_PROJECTION: true,
      LINE_WIDTH: 1.2,
      USE_COLOR: false,
      SHAPESHIFTING_MODE: false,
      SHAPESHIFTING_RATE: 0.5,
      SHAPESHIFTING_AMOUNT: 30,
      AT_FIELD_SIZE: 120,
      AT_FIELD_DURATION: 2000,
      AT_FIELD_FOLLOW_PROJECTION: false,
      ENABLE_RAY: false,
      RAY_LENGTH: 400,
      RAY_PULSE_RATE: 1.0
    },
    WINDMILL: {
      RADIUS: 50,
      ROTATION_RATE: 0.4,
      CHIRALITY: 1,
      DEPTH: 0.10,
      INSTANCE_COUNT: 3,
      SPACING: 410,
      SCALE: 1.0,
      LINE_WIDTH: 1.6,
      ACCELERATION_FACTOR: 3.4,
      ACCELERATION_DURATION: 1.0,
      PERSPECTIVE: 0.0,
      ENABLE_PROJECTION: true,
      BLADE_MULTIPLIER: 4,
      SPIRAL_SCALE: 5.0,
      GOLDEN_ANGLE: 3.4,
      SIZE_VARIATION: 0.15,
      BLADE_WIDTH: 0.50,
      HUB_RADIUS: 8,
      USE_COLOR: true
    },
    ORIZURU: {
      FOLD_AMOUNT: 1.0,
      PERSPECTIVE: 3.0,
      Y_ROTATION: 0.0,
      SCALE: 200,
      LINE_WIDTH: 1.0,
      PROJECTION_DEPTH: 0.3,
      INSTANCES: 1,
      SPATIAL_RADIUS: 200,
      ENABLE_PROJECTION: true,
      USE_COLOR: false
    }
  },

  // Tablet settings
  TABLET: {
    CLEAR_INTERVAL: 300 * 1000, // 5 minutes
    DEFAULT_LINE_WIDTH: 4,
    COORDINATE_MAX: 32767,
    PRESSURE_MAX: 65535,
    VENDOR_ID: 0x28BD,
    PRODUCT_ID: 0x2901,
    REPORT_ID: 0x07,
    // WebSocket settings for Windows HID bridge
    WEBSOCKET: {
      DEFAULT_HOST: 'localhost',
      DEFAULT_PORT: 5678,
      RECONNECT_DELAY: 1000,
      MAX_RECONNECT_ATTEMPTS: 10
    }
  },

  // Animation settings
  ANIMATION: {
    FADE_DURATION: 2000, // 2 seconds
    MAX_AGE: 100000 // 100 seconds
  }
}

// MIDI channel mappings
export const MIDI_CHANNELS = {
  'bus 1': 'lissajous',
  'bus 2': 'harmonograph',
  'bus 3': 'sphere',
  'bus 4': 'gegoNet',
  'bus 5': 'sinewave',
  'bus 6': 'triangle',
  'bus 7': 'moireCircles',
  'bus 8': 'gegoShape',
  'bus 9': 'sotoGrid',
  'bus 10': 'sotoGridRotated',
  'bus 11': 'scanlineGradients',
  'bus 12': 'phyllotaxis',
  'bus 13': 'wovenNet',
  'bus 14': 'polygons',
  'bus 15': 'whitneyLines',
  'bus 16': 'noiseValley',
  'bus 17': 'catenoid',
  'bus 18': 'lineCylinder',
  'bus 19': 'clavilux',
  'bus 20': 'diamond',
  'bus 21': 'cube',
  'bus 22': 'trefoil',
  'bus 23': 'sphericalLens',
  'bus 24': 'ramiel',
  'bus 25': 'deJong'
}

// Utility functions
export const UTILS = {
  pitchColorFactor: 30, // Default factor, can be adjusted via UI

  pitchToColor: (midi) => {
    const factor = UTILS.pitchColorFactor || 30
    const hue = (midi % 14) * factor
    return `hsla(${hue}, 100%, 70%, 0.6)`
  },

  hexToRgba: (hex, alpha = 1) => {
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    return `rgba(${r}, ${g}, ${b}, ${alpha})`
  },

  hslaToRgb: (hslaString) => {
    const match = /hsla?\\(([^)]+)\\)/.exec(hslaString)
    if (!match) return [1, 1, 1]
  
    const parts = match[1].split(',').map(s => s.trim())
    const h = parseFloat(parts[0])
    const s = parseFloat(parts[1]) / 100
    const l = parseFloat(parts[2]) / 100
  
    const c = (1 - Math.abs(2 * l - 1)) * s
    const hp = (h % 360) / 60
    const x = c * (1 - Math.abs((hp % 2) - 1))
  
    let r1 = 0; let g1 = 0; let b1 = 0
    if (hp >= 0 && hp < 1) [r1, g1, b1] = [c, x, 0]
    else if (hp >= 1 && hp < 2) [r1, g1, b1] = [x, c, 0]
    else if (hp >= 2 && hp < 3) [r1, g1, b1] = [0, c, x]
    else if (hp >= 3 && hp < 4) [r1, g1, b1] = [0, x, c]
    else if (hp >= 4 && hp < 5) [r1, g1, b1] = [x, 0, c]
    else if (hp >= 5 && hp < 6) [r1, g1, b1] = [c, 0, x]
  
    const m = l - c / 2
    return [r1 + m, g1 + m, b1 + m]
  },

  rotate3D: (x, y, z, angleX, angleY) => {
    // Rotate around X axis
    const y1 = y * Math.cos(angleX) - z * Math.sin(angleX)
    const z1 = y * Math.sin(angleX) + z * Math.cos(angleX)
    // Rotate around Y axis
    const x1 = x * Math.cos(angleY) + z1 * Math.sin(angleY)
    const z2 = -x * Math.sin(angleY) + z1 * Math.cos(angleY)
    return [x1, y1, z2]
  }
}
