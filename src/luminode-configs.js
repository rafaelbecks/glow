// Luminode configuration definitions with grouping
// This file contains all the parameter configurations for each luminode

export const LUMINODE_CONFIGS = {
  // Classic Patterns
  lissajous: {
    group: 'Classic Patterns',
    config: [
      { key: 'SCALE', label: 'Scale', type: 'slider', min: 50, max: 500, step: 10, default: 250 },
      { key: 'ROTATION_SPEED', label: 'Rotation Speed', type: 'slider', min: 0, max: 1, step: 0.01, default: 0.1 },
      { key: 'LINE_WIDTH', label: 'Line Width', type: 'slider', min: 0.5, max: 5, step: 0.1, default: 1 },
      { key: 'SHADOW_BLUR', label: 'Shadow Blur', type: 'slider', min: 0, max: 50, step: 1, default: 25 }
    ]
  },

  harmonograph: {
    group: 'Classic Patterns',
    config: [
      { key: 'BASE_AMPLITUDE', label: 'Base Amplitude', type: 'slider', min: 50, max: 200, step: 5, default: 100 },
      { key: 'AMPLITUDE_VARIATION', label: 'Amplitude Variation', type: 'slider', min: 10, max: 100, step: 5, default: 50 },
      { key: 'VELOCITY_SCALE', label: 'Velocity Scale', type: 'slider', min: 0.5, max: 3, step: 0.1, default: 1.5 },
      { key: 'ITERATIONS', label: 'Iterations', type: 'number', min: 1000, max: 5000, step: 100, default: 3000 },
      { key: 'TIME_STEP', label: 'Time Step', type: 'slider', min: 0.001, max: 0.01, step: 0.0001, default: 0.002 },
      { key: 'SHADOW_BLUR', label: 'Shadow Blur', type: 'slider', min: 0, max: 50, step: 1, default: 25 }
    ]
  },

  sinewave: {
    group: 'Classic Patterns',
    config: [
      { key: 'LINE_WIDTH', label: 'Line Width', type: 'slider', min: 0.5, max: 6, step: 0.1, default: 1.5 }
    ]
  },

  triangle: {
    group: 'Classic Patterns',
    config: [
      { key: 'SIZE', label: 'Size', type: 'slider', min: 50, max: 500, step: 5, default: 250 },
      { key: 'ROTATION_SPEED', label: 'Rotation Speed', type: 'slider', min: 0.1, max: 2, step: 0.1, default: 0.8 },
      { key: 'LINE_WIDTH', label: 'Line Width', type: 'slider', min: 0.5, max: 3, step: 0.1, default: 1.2 },
      { key: 'OPACITY', label: 'Opacity', type: 'slider', min: 0.1, max: 1, step: 0.05, default: 0.7 }
    ]
  },

  polygons: {
    group: 'Classic Patterns',
    config: [
      { key: 'BASE_LAYERS', label: 'Base Layers', type: 'number', min: 1, max: 5, step: 1, default: 2 },
      { key: 'MAX_LAYERS', label: 'Max Layers', type: 'number', min: 2, max: 6, step: 1, default: 3 },
      { key: 'MAX_SIZE', label: 'Max Size', type: 'slider', min: 100, max: 400, step: 10, default: 220 },
      { key: 'SPACING', label: 'Spacing', type: 'slider', min: 20, max: 80, step: 2, default: 40 },
      { key: 'LAYER_OFFSET', label: 'Layer Offset', type: 'slider', min: 5, max: 25, step: 1, default: 12 },
      { key: 'JITTER_BASE', label: 'Jitter Base', type: 'slider', min: 1, max: 10, step: 0.5, default: 4 },
      { key: 'JITTER_INCREMENT', label: 'Jitter Increment', type: 'slider', min: 0.5, max: 3, step: 0.1, default: 1.5 },
      { key: 'BASE_SIDES', label: 'Base Sides', type: 'number', min: 3, max: 12, step: 1, default: 6 },
      { key: 'SIDES_VARIATION', label: 'Sides Variation', type: 'number', min: 0, max: 6, step: 1, default: 3 }
    ]
  },

  // 3D Geometry
  sphere: {
    group: '3D Geometry',
    config: [
      { key: 'BASE_RADIUS', label: 'Base Radius', type: 'slider', min: 50, max: 300, step: 10, default: 160 },
      { key: 'LAT_LINES', label: 'Latitude Lines', type: 'number', min: 3, max: 30, step: 1, default: 12 },
      { key: 'LON_LINES', label: 'Longitude Lines', type: 'number', min: 3, max: 50, step: 1, default: 20 },
      { key: 'DEFORM_FACTOR', label: 'Deform Factor', type: 'slider', min: 0.5, max: 3, step: 0.1, default: 1.2 },
      { key: 'LINE_WIDTH', label: 'Line Width', type: 'slider', min: 0.3, max: 2, step: 0.1, default: 0.8 },
      { key: 'USE_COLOR', label: 'Color Mode', type: 'checkbox', default: false }
    ]
  },

  noiseValley: {
    group: '3D Geometry',
    config: [
      { key: 'SIZE', label: 'Size', type: 'slider', min: 0.3, max: 1.2, step: 0.05, default: 0.8 },
      { key: 'DENSITY', label: 'Density', type: 'slider', min: 10, max: 60, step: 2, default: 40 },
      { key: 'ROTATION_SPEED', label: 'Rotation Speed', type: 'slider', min: 0.1, max: 3, step: 0.05, default: 0.3 },
      { key: 'DEFORMATION_STRENGTH', label: 'Deformation', type: 'slider', min: 0.1, max: 2, step: 0.1, default: 0.5 },
      { key: 'LINE_WIDTH', label: 'Line Width', type: 'slider', min: 0.3, max: 2, step: 0.1, default: 0.8 },
      { key: 'HEIGHT_SCALE', label: 'Height Scale', type: 'slider', min: 10, max: 100, step: 5, default: 30 },
      { key: 'PERSPECTIVE', label: 'Perspective', type: 'slider', min: 0.2, max: 1.5, step: 0.1, default: 0.6 },
      { key: 'BASE_HUE', label: 'Base Hue', type: 'slider', min: 0, max: 360, step: 10, default: 0 },
      { key: 'USE_COLOR', label: 'Color Mode', type: 'checkbox', default: false }
    ]
  },

  catenoid: {
    group: '3D Geometry',
    config: [
      { key: 'RADIUS', label: 'Radius', type: 'slider', min: 30, max: 150, step: 5, default: 80 },
      { key: 'HEIGHT', label: 'Height', type: 'slider', min: 100, max: 400, step: 10, default: 300 },
      { key: 'RINGS', label: 'Rings', type: 'number', min: 1, max: 50, step: 2, default: 16 },
      { key: 'SEGMENTS', label: 'Segments', type: 'number', min: 1, max: 48, step: 2, default: 24 },
      { key: 'SCALE', label: 'Scale', type: 'slider', min: 0.5, max: 2, step: 0.1, default: 1.0 },
      { key: 'ROTATION_SPEED', label: 'Rotation Speed', type: 'slider', min: 0, max: 3, step: 0.05, default: 0.3 },
      { key: 'DEFORMATION_STRENGTH', label: 'Deformation', type: 'slider', min: 0, max: 2, step: 0.1, default: 0.5 },
      { key: 'LINE_WIDTH', label: 'Line Width', type: 'slider', min: 0.3, max: 2, step: 0.1, default: 0.8 },
      { key: 'BASE_HUE', label: 'Base Hue', type: 'slider', min: 0, max: 360, step: 10, default: 0 },
      { key: 'USE_COLOR', label: 'Color Mode', type: 'checkbox', default: false }
    ]
  },

  lineCylinder: {
    group: '3D Geometry',
    config: [
      { key: 'RADIUS', label: 'Radius', type: 'slider', min: 50, max: 200, step: 5, default: 100 },
      { key: 'HEIGHT', label: 'Height', type: 'slider', min: 100, max: 400, step: 10, default: 300 },
      { key: 'LINES_PER_NOTE', label: 'Lines Per Note', type: 'number', min: 3, max: 15, step: 1, default: 8 },
      { key: 'SCALE', label: 'Scale', type: 'slider', min: 0.5, max: 2, step: 0.1, default: 1.5 },
      { key: 'ROTATION_SPEED', label: 'Rotation Speed', type: 'slider', min: 0, max: 3, step: 0.05, default: 0.3 },
      { key: 'ANIMATION_SPEED', label: 'Animation Speed', type: 'slider', min: 0.1, max: 2, step: 0.1, default: 0.5 },
      { key: 'SEPARATION_THRESHOLD', label: 'Separation Threshold', type: 'slider', min: 0, max: 0.5, step: 0.01, default: 0.1 },
      { key: 'DEFORMATION_STRENGTH', label: 'Deformation', type: 'slider', min: 0, max: 2, step: 0.1, default: 0.4 },
      { key: 'LINE_WIDTH', label: 'Line Width', type: 'slider', min: 0.3, max: 2, step: 0.1, default: 0.8 },
      { key: 'BASE_HUE', label: 'Base Hue', type: 'slider', min: 0, max: 360, step: 10, default: 0 },
      { key: 'USE_COLOR', label: 'Color Mode', type: 'checkbox', default: false }
    ]
  },

  diamond: {
    group: '3D Geometry',
    config: [
      { key: 'RADIUS', label: 'Radius', type: 'slider', min: 30, max: 150, step: 5, default: 80 },
      { key: 'HEIGHT', label: 'Height', type: 'slider', min: 100, max: 300, step: 10, default: 200 },
      { key: 'RINGS', label: 'Rings', type: 'number', min: 1, max: 30, step: 1, default: 8 },
      { key: 'SEGMENTS', label: 'Segments', type: 'number', min: 1, max: 48, step: 2, default: 36 },
      { key: 'INSTANCES', label: 'Instances', type: 'number', min: 1, max: 16, step: 1, default: 2 },
      { key: 'RADIAL_SPACING', label: 'Radial Spacing', type: 'slider', min: 40, max: 300, step: 10, default: 140 },
      { key: 'SCALE', label: 'Scale', type: 'slider', min: 0.5, max: 2, step: 0.1, default: 1.7 },
      { key: 'ROTATION_SPEED', label: 'Rotation Speed', type: 'slider', min: 0, max: 3, step: 0.05, default: 0.3 },
      { key: 'LINE_WIDTH', label: 'Line Width', type: 'slider', min: 0.3, max: 2, step: 0.1, default: 0.8 },
      { key: 'USE_COLOR', label: 'Color Mode', type: 'checkbox', default: false }
    ]
  },

  cube: {
    group: '3D Geometry',
    config: [
      { key: 'SIZE', label: 'Size', type: 'slider', min: 50, max: 300, step: 10, default: 150 },
      { key: 'SEGMENTS', label: 'Segments', type: 'number', min: 1, max: 40, step: 1, default: 5 },
      { key: 'SCALE', label: 'Scale', type: 'slider', min: 0.5, max: 2, step: 0.1, default: 1.0 },
      { key: 'ROTATION_SPEED', label: 'Rotation Speed', type: 'slider', min: 0, max: 3, step: 0.05, default: 0.3 },
      { key: 'LINE_WIDTH', label: 'Line Width', type: 'slider', min: 0.3, max: 2, step: 0.1, default: 0.8 },
      { key: 'USE_COLOR', label: 'Color Mode', type: 'checkbox', default: false }
    ]
  },

  trefoil: {
    group: '3D Geometry',
    config: [
      { key: 'NODE_MODE', label: 'Node Mode', type: 'checkbox', default: true },
      { key: 'NUM_LACES', label: 'Number of Laces', type: 'number', min: 1, max: 16, step: 1, default: 3 },
      { key: 'SCALE', label: 'Scale', type: 'slider', min: 20, max: 120, step: 5, default: 95 },
      { key: 'SCALE_VARIATION', label: 'Scale Variation', type: 'slider', min: 0, max: 0.5, step: 0.05, default: 0.5 },
      { key: 'SEGMENTS', label: 'Segments', type: 'number', min: 50, max: 300, step: 10, default: 150 },
      { key: 'ROTATION_SPEED', label: 'Rotation Speed', type: 'slider', min: 0, max: 3, step: 0.05, default: 0.3 },
      { key: 'LINE_WIDTH', label: 'Line Width', type: 'slider', min: 0.3, max: 2, step: 0.1, default: 0.8 },
      { key: 'USE_COLOR', label: 'Color Mode', type: 'checkbox', default: true }
    ]
  },

  // Art-Inspired
  gegoNet: {
    group: 'Art-Inspired',
    config: [
      { key: 'BASE_NODES', label: 'Base Nodes', type: 'number', min: 3, max: 10, step: 1, default: 5 },
      { key: 'NODES_PER_NOTE', label: 'Nodes Per Note', type: 'number', min: 5, max: 30, step: 1, default: 15 },
      { key: 'CONNECTION_DISTANCE', label: 'Connection Distance', type: 'slider', min: 0.3, max: 1, step: 0.05, default: 0.7 },
      { key: 'MAX_CONNECTIONS', label: 'Max Connections', type: 'number', min: 2, max: 10, step: 1, default: 5 }
    ]
  },

  gegoShape: {
    group: 'Art-Inspired',
    config: [
      { key: 'BASE_NODES', label: 'Base Nodes', type: 'number', min: 3, max: 8, step: 1, default: 4 },
      { key: 'NODES_PER_NOTE', label: 'Nodes Per Note', type: 'number', min: 1, max: 5, step: 1, default: 2 },
      { key: 'BASE_SIZE', label: 'Base Size', type: 'slider', min: 100, max: 400, step: 10, default: 240 },
      { key: 'CONNECTION_PROBABILITY', label: 'Connection Probability', type: 'slider', min: 0.1, max: 0.8, step: 0.05, default: 0.3 }
    ]
  },

  sotoGrid: {
    group: 'Art-Inspired',
    config: [
      { key: 'BASE_SIZE', label: 'Base Size', type: 'slider', min: 40, max: 120, step: 5, default: 80 },
      { key: 'VELOCITY_MULTIPLIER', label: 'Velocity Multiplier', type: 'slider', min: 1, max: 10, step: 0.5, default: 5 },
      { key: 'STRIPE_WIDTH', label: 'Stripe Width', type: 'slider', min: 1, max: 8, step: 0.5, default: 3 },
      { key: 'SOLID_HEIGHT_RATIO', label: 'Solid Height Ratio', type: 'slider', min: 0.1, max: 0.5, step: 0.05, default: 0.2 }
    ]
  },

  sotoGridRotated: {
    group: 'Art-Inspired',
    config: [
      { key: 'BASE_SIZE', label: 'Base Size', type: 'slider', min: 40, max: 120, step: 5, default: 80 },
      { key: 'VELOCITY_MULTIPLIER', label: 'Velocity Multiplier', type: 'slider', min: 1, max: 10, step: 0.5, default: 5 },
      { key: 'STRIPE_WIDTH', label: 'Stripe Width', type: 'slider', min: 1, max: 8, step: 0.5, default: 3 },
      { key: 'SOLID_HEIGHT_RATIO', label: 'Solid Height Ratio', type: 'slider', min: 0.1, max: 0.5, step: 0.05, default: 0.2 }
    ]
  },

  whitneyLines: {
    group: 'Art-Inspired',
    config: [
      { key: 'RADIUS', label: 'Radius', type: 'slider', min: 100, max: 400, step: 10, default: 250 },
      { key: 'LINES_PER_NOTE', label: 'Lines Per Note', type: 'number', min: 5, max: 20, step: 1, default: 10 },
      { key: 'ROTATION_SPEED', label: 'Rotation Speed', type: 'slider', min: 0.1, max: 2, step: 0.1, default: 0.5 },
      { key: 'LINE_WIDTH', label: 'Line Width', type: 'slider', min: 0.3, max: 2, step: 0.1, default: 0.8 },
      { key: 'SHADOW_BLUR', label: 'Shadow Blur', type: 'slider', min: 0, max: 30, step: 1, default: 15 },
      { key: 'USE_COLOR', label: 'Color Mode', type: 'checkbox', default: false }
    ]
  },

  clavilux: {
    group: 'Art-Inspired',
    config: [
      { key: 'BASE_SIZE', label: 'Light Size', type: 'slider', min: 60, max: 200, step: 10, default: 120 },
      { key: 'SIZE_VARIATION', label: 'Size Variation', type: 'slider', min: 20, max: 120, step: 10, default: 80 },
      { key: 'CENTER_AREA', label: 'Center Area', type: 'slider', min: 150, max: 500, step: 25, default: 300 },
      { key: 'FLOAT_SPEED', label: 'Float Speed', type: 'slider', min: 0.02, max: 0.3, step: 0.01, default: 0.1 },
      { key: 'FADE_DURATION', label: 'Fade Duration', type: 'slider', min: 2000, max: 10000, step: 500, default: 5000 },
      { key: 'MAX_FORMS', label: 'Max Forms', type: 'number', min: 5, max: 40, step: 5, default: 20 }
    ]
  },

  // Natural Patterns
  phyllotaxis: {
    group: 'Natural Patterns',
    config: [
      { key: 'GOLDEN_ANGLE', label: 'Golden Angle', type: 'slider', min: 2, max: 4, step: 0.1, default: Math.PI * (3 - Math.sqrt(5)) },
      { key: 'SCALE', label: 'Scale', type: 'slider', min: 5, max: 25, step: 1, default: 12 },
      { key: 'BASE_SIZE', label: 'Base Size', type: 'slider', min: 1, max: 8, step: 0.5, default: 3 },
      { key: 'MAX_SIZE', label: 'Max Size', type: 'slider', min: 3, max: 15, step: 1, default: 9 },
      { key: 'ROTATION_SPEED', label: 'Rotation Speed', type: 'slider', min: 0.05, max: 0.5, step: 0.01, default: 0.15 },
      { key: 'DOTS_PER_NOTE', label: 'Dots Per Note', type: 'number', min: 5, max: 50, step: 1, default: 20 }
    ]
  },

  sphericalLens: {
    group: 'Natural Patterns',
    config: [
      { key: 'RADIUS', label: 'Lens Radius', type: 'slider', min: 100, max: 400, step: 10, default: 200 },
      { key: 'LINES_PER_NOTE', label: 'Lines Per Note', type: 'number', min: 3, max: 20, step: 1, default: 8 },
      { key: 'ABERRATION_STRENGTH', label: 'Aberration Strength', type: 'slider', min: 0.5, max: 3, step: 0.1, default: 1.0 },
      { key: 'ORIENTATION', label: 'Orientation', type: 'select', options: [{ value: 'horizontal', label: 'Horizontal' }, { value: 'vertical', label: 'Vertical' }], default: 'horizontal' },
      { key: 'LINE_LENGTH', label: 'Line Length', type: 'slider', min: 0, max: 2000, step: 50, default: 0, note: '0 = full canvas width/height' },
      { key: 'LINE_WIDTH', label: 'Line Width', type: 'slider', min: 0.5, max: 3, step: 0.1, default: 1.0 },
      { key: 'LENS_WIDTH', label: 'Lens Width', type: 'slider', min: 0.5, max: 3, step: 0.1, default: 1.5 },
      // { key: 'SHADOW_BLUR', label: 'Shadow Blur', type: 'slider', min: 0, max: 30, step: 1, default: 0 },
      { key: 'WAVE_SPEED', label: 'Wave Speed', type: 'slider', min: 0.1, max: 1, step: 0.05, default: 0.3 },
      { key: 'WAVE_AMPLITUDE', label: 'Wave Amplitude', type: 'slider', min: 0, max: 20, step: 1, default: 5 },
      { key: 'ROTATION_SPEED', label: 'Rotation Speed', type: 'slider', min: 0, max: 0.5, step: 0.05, default: 0.1 },
      { key: 'SHOW_POINT_SOURCE', label: 'Show Point Source', type: 'checkbox', default: false },
      { key: 'USE_COLOR', label: 'Color Mode', type: 'checkbox', default: false },
      { key: 'CHROMATIC_ABERRATION', label: 'Chromatic Aberration', type: 'slider', min: 0, max: 30, step: 1, default: 0 }
    ]
  },

  moireCircles: {
    group: 'Natural Patterns',
    config: [
      { key: 'BASE_COUNT', label: 'Base Count', type: 'number', min: 3, max: 15, step: 1, default: 8 },
      { key: 'SPACING', label: 'Spacing', type: 'slider', min: 20, max: 60, step: 2, default: 35 },
      { key: 'SPEED', label: 'Speed', type: 'slider', min: 0.0005, max: 0.005, step: 0.0001, default: 0.0015 }
    ]
  },

  wovenNet: {
    group: 'Natural Structures',
    config: [
      { key: 'BASE_GRID_SIZE', label: 'Base Grid Size', type: 'number', min: 3, max: 10, step: 1, default: 5 },
      { key: 'GRID_SIZE_PER_NOTE', label: 'Grid Size Per Note', type: 'number', min: 1, max: 5, step: 1, default: 2 },
      { key: 'SPACING', label: 'Spacing', type: 'slider', min: 15, max: 50, step: 2, default: 30 },
      { key: 'BASE_SIZE', label: 'Base Size', type: 'slider', min: 10, max: 40, step: 2, default: 20 },
      { key: 'SIZE_VARIATION', label: 'Size Variation', type: 'slider', min: 5, max: 25, step: 1, default: 15 }
    ]
  },

  epitrochoid: {
    group: 'Natural Patterns',
    config: [
      { key: 'BASE_SIZE', label: 'Base Size', type: 'slider', min: 150, max: 1200, step: 5, default: 350 },
      { key: 'GROWTH_RATE', label: 'Growth Rate', type: 'slider', min: 0, max: 0.5, step: 0.05, default: 0.2 },
      { key: 'ROTATION_SPEED', label: 'Rotation Speed', type: 'slider', min: 0, max: 1, step: 0.05, default: 0.3 },
      { key: 'SEGMENTS', label: 'Segments', type: 'number', min: 50, max: 400, step: 10, default: 200 },
      { key: 'LINES_PER_NOTE', label: 'Lines Per Note', type: 'number', min: 1, max: 5, step: 1, default: 1 },
      { key: 'DEPTH_PROJECTION', label: 'Depth Projection', type: 'slider', min: 0, max: 0.5, step: 0.05, default: 0.2 },
      { key: 'LINE_WIDTH', label: 'Line Width', type: 'slider', min: 0.5, max: 2, step: 0.1, default: 1 },
      { key: 'USE_3D_ROTATION', label: '3D Rotation', type: 'checkbox', default: true },
      { key: 'USE_COLOR', label: 'Color Mode', type: 'checkbox', default: false }
    ]
  }
}

// Helper function to get configuration for a specific luminode
export function getLuminodeConfig (luminodeName) {
  const config = LUMINODE_CONFIGS[luminodeName]
  return config ? config.config : []
}

// Helper function to get group for a specific luminode
export function getLuminodeGroup (luminodeName) {
  const config = LUMINODE_CONFIGS[luminodeName]
  return config ? config.group : 'Other'
}

// Helper function to get all available luminodes with configurations
export function getAvailableLuminodes () {
  return Object.keys(LUMINODE_CONFIGS)
}

// Helper function to check if a luminode has configuration
export function hasLuminodeConfig (luminodeName) {
  return luminodeName in LUMINODE_CONFIGS
}

// Helper function to get luminodes grouped by category
export function getLuminodesByGroup () {
  const grouped = {}
  Object.entries(LUMINODE_CONFIGS).forEach(([name, config]) => {
    const group = config.group
    if (!grouped[group]) {
      grouped[group] = []
    }
    grouped[group].push(name)
  })
  return grouped
}
