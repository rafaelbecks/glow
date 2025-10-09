// Settings and configuration constants
export const SETTINGS = {
  // Canvas settings
  CANVAS: {
    CLEAR_ALPHA: 0.4,
    BACKGROUND_COLOR: '#000',
    CRT_MODE: false,
    CRT_INTENSITY: 100,
    LUMIA_EFFECT: 0
  },

  // MIDI settings
  MIDI: {
    NOTE_ON: 0x90,
    NOTE_OFF: 0x80,
    VELOCITY_MAX: 127
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
      DEFORM_FACTOR: 1.2
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
  'bus 19': 'clavilux'
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
