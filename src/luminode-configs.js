// Luminode configuration definitions with grouping
// This file contains all the parameter configurations for each luminode

export const LUMINODE_CONFIGS = {
  // Classic Patterns
  lissajous: {
    group: 'Classic Patterns',
    config: [
      {
        key: 'SCALE',
        label: 'Scale',
        type: 'slider',
        min: 50,
        max: 500,
        step: 10,
        default: 250
      },
      {
        key: 'ROTATION_SPEED',
        label: 'Rotation Speed',
        type: 'slider',
        min: 0,
        max: 1,
        step: 0.01,
        default: 0.1
      },
      {
        key: 'LINE_WIDTH',
        label: 'Line Width',
        type: 'slider',
        min: 0.5,
        max: 5,
        step: 0.1,
        default: 1
      },
      {
        key: 'SHADOW_BLUR',
        label: 'Shadow Blur',
        type: 'slider',
        min: 0,
        max: 50,
        step: 1,
        default: 25
      }
    ]
  },

  harmonograph: {
    group: 'Classic Patterns',
    config: [
      {
        key: 'BASE_AMPLITUDE',
        label: 'Base Amplitude',
        type: 'slider',
        min: 50,
        max: 200,
        step: 5,
        default: 100
      },
      {
        key: 'AMPLITUDE_VARIATION',
        label: 'Amplitude Variation',
        type: 'slider',
        min: 10,
        max: 100,
        step: 5,
        default: 50
      },
      {
        key: 'VELOCITY_SCALE',
        label: 'Velocity Scale',
        type: 'slider',
        min: 0.5,
        max: 3,
        step: 0.1,
        default: 1.5
      },
      {
        key: 'ITERATIONS',
        label: 'Iterations',
        type: 'number',
        min: 1000,
        max: 5000,
        step: 100,
        default: 3000
      },
      {
        key: 'TIME_STEP',
        label: 'Time Step',
        type: 'slider',
        min: 0.001,
        max: 0.01,
        step: 0.0001,
        default: 0.002
      },
      {
        key: 'SHADOW_BLUR',
        label: 'Shadow Blur',
        type: 'slider',
        min: 0,
        max: 50,
        step: 1,
        default: 25
      }
    ]
  },

  sinewave: {
    group: 'Classic Patterns',
    config: [
      {
        key: 'LINE_WIDTH',
        label: 'Line Width',
        type: 'slider',
        min: 0.5,
        max: 6,
        step: 0.1,
        default: 1.5
      }
    ]
  },

  triangle: {
    group: 'Classic Patterns',
    config: [
      {
        key: 'SIZE',
        label: 'Size',
        type: 'slider',
        min: 50,
        max: 500,
        step: 5,
        default: 250
      },
      {
        key: 'ROTATION_SPEED',
        label: 'Rotation Speed',
        type: 'slider',
        min: 0.1,
        max: 2,
        step: 0.1,
        default: 0.8
      },
      {
        key: 'LINE_WIDTH',
        label: 'Line Width',
        type: 'slider',
        min: 0.5,
        max: 3,
        step: 0.1,
        default: 1.2
      },
      {
        key: 'OPACITY',
        label: 'Opacity',
        type: 'slider',
        min: 0.1,
        max: 1,
        step: 0.05,
        default: 0.7
      }
    ]
  },

  polygons: {
    group: 'Classic Patterns',
    config: [
      {
        key: 'BASE_LAYERS',
        label: 'Base Layers',
        type: 'number',
        min: 1,
        max: 5,
        step: 1,
        default: 2
      },
      {
        key: 'MAX_LAYERS',
        label: 'Max Layers',
        type: 'number',
        min: 2,
        max: 6,
        step: 1,
        default: 3
      },
      {
        key: 'MAX_SIZE',
        label: 'Max Size',
        type: 'slider',
        min: 100,
        max: 400,
        step: 10,
        default: 220
      },
      {
        key: 'SPACING',
        label: 'Spacing',
        type: 'slider',
        min: 20,
        max: 80,
        step: 2,
        default: 40
      },
      {
        key: 'LAYER_OFFSET',
        label: 'Layer Offset',
        type: 'slider',
        min: 5,
        max: 25,
        step: 1,
        default: 12
      },
      {
        key: 'JITTER_BASE',
        label: 'Jitter Base',
        type: 'slider',
        min: 1,
        max: 10,
        step: 0.5,
        default: 4
      },
      {
        key: 'JITTER_INCREMENT',
        label: 'Jitter Increment',
        type: 'slider',
        min: 0.5,
        max: 3,
        step: 0.1,
        default: 1.5
      },
      {
        key: 'BASE_SIDES',
        label: 'Base Sides',
        type: 'number',
        min: 3,
        max: 12,
        step: 1,
        default: 6
      },
      {
        key: 'SIDES_VARIATION',
        label: 'Sides Variation',
        type: 'number',
        min: 0,
        max: 6,
        step: 1,
        default: 3
      }
    ]
  },

  // 3D Geometry
  sphere: {
    group: '3D Geometry',
    config: [
      {
        key: 'ROTATION',
        label: 'Rotation',
        type: 'rotation',
        default: { x: 0, y: 0, z: 0 }
      },
      {
        key: 'ROTATION_ENABLED',
        label: 'Rotation Enabled',
        type: 'checkbox',
        default: true
      },
      {
        key: 'BASE_RADIUS',
        label: 'Base Radius',
        type: 'slider',
        min: 50,
        max: 300,
        step: 10,
        default: 160
      },
      {
        key: 'LAT_LINES',
        label: 'Latitude Lines',
        type: 'number',
        min: 3,
        max: 30,
        step: 1,
        default: 12
      },
      {
        key: 'LON_LINES',
        label: 'Longitude Lines',
        type: 'number',
        min: 3,
        max: 50,
        step: 1,
        default: 20
      },
      {
        key: 'DEFORM_FACTOR',
        label: 'Deform Factor',
        type: 'slider',
        min: 0.5,
        max: 3,
        step: 0.1,
        default: 1.2
      },
      {
        key: 'LINE_WIDTH',
        label: 'Line Width',
        type: 'slider',
        min: 0.3,
        max: 2,
        step: 0.1,
        default: 0.8
      },
      {
        key: 'USE_COLOR',
        label: 'Color Mode',
        type: 'checkbox',
        default: false
      }
    ]
  },

  noiseValley: {
    group: '3D Geometry',
    config: [
      {
        key: 'ROTATION',
        label: 'Rotation',
        type: 'rotation',
        default: { x: 0, y: 0, z: 0 }
      },
      {
        key: 'ROTATION_ENABLED',
        label: 'Rotation Enabled',
        type: 'checkbox',
        default: true
      },
      {
        key: 'SIZE',
        label: 'Size',
        type: 'slider',
        min: 0.3,
        max: 1.2,
        step: 0.05,
        default: 0.8
      },
      {
        key: 'DENSITY',
        label: 'Density',
        type: 'slider',
        min: 10,
        max: 60,
        step: 2,
        default: 40
      },
      {
        key: 'ROTATION_SPEED',
        label: 'Rotation Speed',
        type: 'slider',
        min: 0.1,
        max: 3,
        step: 0.05,
        default: 0.3
      },
      {
        key: 'DEFORMATION_STRENGTH',
        label: 'Deformation',
        type: 'slider',
        min: 0.1,
        max: 2,
        step: 0.1,
        default: 0.5
      },
      {
        key: 'LINE_WIDTH',
        label: 'Line Width',
        type: 'slider',
        min: 0.3,
        max: 2,
        step: 0.1,
        default: 0.8
      },
      {
        key: 'HEIGHT_SCALE',
        label: 'Height Scale',
        type: 'slider',
        min: 10,
        max: 100,
        step: 5,
        default: 30
      },
      {
        key: 'PERSPECTIVE',
        label: 'Perspective',
        type: 'slider',
        min: 0.2,
        max: 1.5,
        step: 0.1,
        default: 0.6
      },
      {
        key: 'BASE_HUE',
        label: 'Base Hue',
        type: 'slider',
        min: 0,
        max: 360,
        step: 10,
        default: 0
      },
      {
        key: 'USE_COLOR',
        label: 'Color Mode',
        type: 'checkbox',
        default: false
      }
    ]
  },

  catenoid: {
    group: '3D Geometry',
    config: [
      {
        key: 'ROTATION',
        label: 'Rotation',
        type: 'rotation',
        default: { x: 0, y: 0, z: 0 }
      },
      {
        key: 'ROTATION_ENABLED',
        label: 'Rotation Enabled',
        type: 'checkbox',
        default: true
      },
      {
        key: 'RADIUS',
        label: 'Radius',
        type: 'slider',
        min: 30,
        max: 150,
        step: 5,
        default: 80
      },
      {
        key: 'HEIGHT',
        label: 'Height',
        type: 'slider',
        min: 100,
        max: 400,
        step: 10,
        default: 300
      },
      {
        key: 'RINGS',
        label: 'Rings',
        type: 'number',
        min: 1,
        max: 50,
        step: 2,
        default: 16
      },
      {
        key: 'SEGMENTS',
        label: 'Segments',
        type: 'number',
        min: 1,
        max: 48,
        step: 2,
        default: 24
      },
      {
        key: 'SCALE',
        label: 'Scale',
        type: 'slider',
        min: 0.5,
        max: 2,
        step: 0.1,
        default: 1.0
      },
      {
        key: 'ROTATION_SPEED',
        label: 'Rotation Speed',
        type: 'slider',
        min: 0,
        max: 3,
        step: 0.05,
        default: 0.3
      },
      {
        key: 'DEFORMATION_STRENGTH',
        label: 'Deformation',
        type: 'slider',
        min: 0,
        max: 2,
        step: 0.1,
        default: 0.5
      },
      {
        key: 'LINE_WIDTH',
        label: 'Line Width',
        type: 'slider',
        min: 0.3,
        max: 2,
        step: 0.1,
        default: 0.8
      },
      {
        key: 'BASE_HUE',
        label: 'Base Hue',
        type: 'slider',
        min: 0,
        max: 360,
        step: 10,
        default: 0
      },
      {
        key: 'USE_COLOR',
        label: 'Color Mode',
        type: 'checkbox',
        default: false
      }
    ]
  },

  lineCylinder: {
    group: '3D Geometry',
    config: [
      {
        key: 'ROTATION',
        label: 'Rotation',
        type: 'rotation',
        default: { x: 0, y: 0, z: 0 }
      },
      {
        key: 'ROTATION_ENABLED',
        label: 'Rotation Enabled',
        type: 'checkbox',
        default: true
      },
      {
        key: 'RADIUS',
        label: 'Radius',
        type: 'slider',
        min: 50,
        max: 200,
        step: 5,
        default: 100
      },
      {
        key: 'HEIGHT',
        label: 'Height',
        type: 'slider',
        min: 100,
        max: 400,
        step: 10,
        default: 300
      },
      {
        key: 'LINES_PER_NOTE',
        label: 'Lines Per Note',
        type: 'number',
        min: 3,
        max: 15,
        step: 1,
        default: 8
      },
      {
        key: 'SCALE',
        label: 'Scale',
        type: 'slider',
        min: 0.5,
        max: 2,
        step: 0.1,
        default: 1.5
      },
      {
        key: 'ROTATION_SPEED',
        label: 'Rotation Speed',
        type: 'slider',
        min: 0,
        max: 3,
        step: 0.05,
        default: 0.3
      },
      {
        key: 'ANIMATION_SPEED',
        label: 'Animation Speed',
        type: 'slider',
        min: 0.1,
        max: 2,
        step: 0.1,
        default: 0.5
      },
      {
        key: 'SEPARATION_THRESHOLD',
        label: 'Separation Threshold',
        type: 'slider',
        min: 0,
        max: 0.5,
        step: 0.01,
        default: 0.1
      },
      {
        key: 'DEFORMATION_STRENGTH',
        label: 'Deformation',
        type: 'slider',
        min: 0,
        max: 2,
        step: 0.1,
        default: 0.4
      },
      {
        key: 'LINE_WIDTH',
        label: 'Line Width',
        type: 'slider',
        min: 0.3,
        max: 2,
        step: 0.1,
        default: 0.8
      },
      {
        key: 'BASE_HUE',
        label: 'Base Hue',
        type: 'slider',
        min: 0,
        max: 360,
        step: 10,
        default: 0
      },
      {
        key: 'USE_COLOR',
        label: 'Color Mode',
        type: 'checkbox',
        default: false
      }
    ]
  },

  diamond: {
    group: '3D Geometry',
    config: [
      {
        key: 'ROTATION',
        label: 'Rotation',
        type: 'rotation',
        default: { x: 0, y: 0, z: 0 }
      },
      {
        key: 'ROTATION_ENABLED',
        label: 'Rotation Enabled',
        type: 'checkbox',
        default: true
      },
      {
        key: 'RADIUS',
        label: 'Radius',
        type: 'slider',
        min: 30,
        max: 150,
        step: 5,
        default: 80
      },
      {
        key: 'HEIGHT',
        label: 'Height',
        type: 'slider',
        min: 100,
        max: 300,
        step: 10,
        default: 200
      },
      {
        key: 'RINGS',
        label: 'Rings',
        type: 'number',
        min: 1,
        max: 30,
        step: 1,
        default: 8
      },
      {
        key: 'SEGMENTS',
        label: 'Segments',
        type: 'number',
        min: 1,
        max: 48,
        step: 2,
        default: 36
      },
      {
        key: 'INSTANCES',
        label: 'Instances',
        type: 'number',
        min: 1,
        max: 16,
        step: 1,
        default: 2
      },
      {
        key: 'RADIAL_SPACING',
        label: 'Radial Spacing',
        type: 'slider',
        min: 40,
        max: 300,
        step: 10,
        default: 140
      },
      {
        key: 'SCALE',
        label: 'Scale',
        type: 'slider',
        min: 0.5,
        max: 2,
        step: 0.1,
        default: 1.7
      },
      {
        key: 'ROTATION_SPEED',
        label: 'Rotation Speed',
        type: 'slider',
        min: 0,
        max: 3,
        step: 0.05,
        default: 0.3
      },
      {
        key: 'LINE_WIDTH',
        label: 'Line Width',
        type: 'slider',
        min: 0.3,
        max: 2,
        step: 0.1,
        default: 0.8
      },
      {
        key: 'USE_COLOR',
        label: 'Color Mode',
        type: 'checkbox',
        default: false
      }
    ]
  },

  cube: {
    group: '3D Geometry',
    config: [
      {
        key: 'ROTATION',
        label: 'Rotation',
        type: 'rotation',
        default: { x: 0, y: 0, z: 0 }
      },
      {
        key: 'ROTATION_ENABLED',
        label: 'Rotation Enabled',
        type: 'checkbox',
        default: true
      },
      {
        key: 'SIZE',
        label: 'Size',
        type: 'slider',
        min: 50,
        max: 300,
        step: 10,
        default: 150
      },
      {
        key: 'SEGMENTS',
        label: 'Segments',
        type: 'number',
        min: 1,
        max: 40,
        step: 1,
        default: 5
      },
      {
        key: 'SCALE',
        label: 'Scale',
        type: 'slider',
        min: 0.5,
        max: 2,
        step: 0.1,
        default: 1.0
      },
      {
        key: 'ROTATION_SPEED',
        label: 'Rotation Speed',
        type: 'slider',
        min: 0,
        max: 3,
        step: 0.05,
        default: 0.3
      },
      {
        key: 'LINE_WIDTH',
        label: 'Line Width',
        type: 'slider',
        min: 0.3,
        max: 2,
        step: 0.1,
        default: 0.8
      },
      {
        key: 'USE_COLOR',
        label: 'Color Mode',
        type: 'checkbox',
        default: false
      }
    ]
  },

  trefoil: {
    group: '3D Geometry',
    config: [
      {
        key: 'ROTATION',
        label: 'Rotation',
        type: 'rotation',
        default: { x: 0, y: 0, z: 0 }
      },
      {
        key: 'ROTATION_ENABLED',
        label: 'Rotation Enabled',
        type: 'checkbox',
        default: true
      },
      { key: 'NODE_MODE', label: 'Node Mode', type: 'checkbox', default: true },
      {
        key: 'NUM_LACES',
        label: 'Number of Laces',
        type: 'number',
        min: 1,
        max: 16,
        step: 1,
        default: 3
      },
      {
        key: 'SCALE',
        label: 'Scale',
        type: 'slider',
        min: 20,
        max: 120,
        step: 5,
        default: 95
      },
      {
        key: 'SCALE_VARIATION',
        label: 'Scale Variation',
        type: 'slider',
        min: 0,
        max: 0.5,
        step: 0.05,
        default: 0.5
      },
      {
        key: 'SEGMENTS',
        label: 'Segments',
        type: 'number',
        min: 50,
        max: 300,
        step: 10,
        default: 150
      },
      {
        key: 'ROTATION_SPEED',
        label: 'Rotation Speed',
        type: 'slider',
        min: 0,
        max: 3,
        step: 0.05,
        default: 0.3
      },
      {
        key: 'LINE_WIDTH',
        label: 'Line Width',
        type: 'slider',
        min: 0.3,
        max: 2,
        step: 0.1,
        default: 0.8
      },
      {
        key: 'USE_COLOR',
        label: 'Color Mode',
        type: 'checkbox',
        default: true
      }
    ]
  },

  // Art-Inspired
  gegoNet: {
    group: 'Art-Inspired',
    config: [
      {
        key: 'BASE_NODES',
        label: 'Base Nodes',
        type: 'number',
        min: 3,
        max: 10,
        step: 1,
        default: 5
      },
      {
        key: 'NODES_PER_NOTE',
        label: 'Nodes Per Note',
        type: 'number',
        min: 5,
        max: 30,
        step: 1,
        default: 15
      },
      {
        key: 'CONNECTION_DISTANCE',
        label: 'Connection Distance',
        type: 'slider',
        min: 0.3,
        max: 1,
        step: 0.05,
        default: 0.7
      },
      {
        key: 'MAX_CONNECTIONS',
        label: 'Max Connections',
        type: 'number',
        min: 2,
        max: 10,
        step: 1,
        default: 5
      }
    ]
  },

  gegoShape: {
    group: 'Art-Inspired',
    config: [
      {
        key: 'BASE_NODES',
        label: 'Base Nodes',
        type: 'number',
        min: 3,
        max: 8,
        step: 1,
        default: 4
      },
      {
        key: 'NODES_PER_NOTE',
        label: 'Nodes Per Note',
        type: 'number',
        min: 1,
        max: 5,
        step: 1,
        default: 2
      },
      {
        key: 'BASE_SIZE',
        label: 'Base Size',
        type: 'slider',
        min: 100,
        max: 400,
        step: 10,
        default: 240
      },
      {
        key: 'CONNECTION_PROBABILITY',
        label: 'Connection Probability',
        type: 'slider',
        min: 0.1,
        max: 0.8,
        step: 0.05,
        default: 0.3
      }
    ]
  },

  sotoGrid: {
    group: 'Art-Inspired',
    config: [
      {
        key: 'BASE_SIZE',
        label: 'Base Size',
        type: 'slider',
        min: 40,
        max: 120,
        step: 5,
        default: 80
      },
      {
        key: 'VELOCITY_MULTIPLIER',
        label: 'Velocity Multiplier',
        type: 'slider',
        min: 1,
        max: 10,
        step: 0.5,
        default: 5
      },
      {
        key: 'STRIPE_WIDTH',
        label: 'Stripe Width',
        type: 'slider',
        min: 1,
        max: 8,
        step: 0.5,
        default: 3
      },
      {
        key: 'SOLID_HEIGHT_RATIO',
        label: 'Solid Height Ratio',
        type: 'slider',
        min: 0.1,
        max: 0.5,
        step: 0.05,
        default: 0.2
      }
    ]
  },

  sotoGridRotated: {
    group: 'Art-Inspired',
    config: [
      {
        key: 'BASE_SIZE',
        label: 'Base Size',
        type: 'slider',
        min: 40,
        max: 120,
        step: 5,
        default: 80
      },
      {
        key: 'VELOCITY_MULTIPLIER',
        label: 'Velocity Multiplier',
        type: 'slider',
        min: 1,
        max: 10,
        step: 0.5,
        default: 5
      },
      {
        key: 'STRIPE_WIDTH',
        label: 'Stripe Width',
        type: 'slider',
        min: 1,
        max: 8,
        step: 0.5,
        default: 3
      },
      {
        key: 'SOLID_HEIGHT_RATIO',
        label: 'Solid Height Ratio',
        type: 'slider',
        min: 0.1,
        max: 0.5,
        step: 0.05,
        default: 0.2
      }
    ]
  },

  whitneyLines: {
    group: 'Art-Inspired',
    config: [
      {
        key: 'RADIUS',
        label: 'Radius',
        type: 'slider',
        min: 100,
        max: 400,
        step: 10,
        default: 250
      },
      {
        key: 'LINES_PER_NOTE',
        label: 'Lines Per Note',
        type: 'number',
        min: 5,
        max: 20,
        step: 1,
        default: 10
      },
      {
        key: 'ROTATION_SPEED',
        label: 'Rotation Speed',
        type: 'slider',
        min: 0.1,
        max: 2,
        step: 0.1,
        default: 0.5
      },
      {
        key: 'LINE_WIDTH',
        label: 'Line Width',
        type: 'slider',
        min: 0.3,
        max: 2,
        step: 0.1,
        default: 0.8
      },
      {
        key: 'SHADOW_BLUR',
        label: 'Shadow Blur',
        type: 'slider',
        min: 0,
        max: 30,
        step: 1,
        default: 15
      },
      {
        key: 'USE_COLOR',
        label: 'Color Mode',
        type: 'checkbox',
        default: false
      }
    ]
  },

  clavilux: {
    group: 'Art-Inspired',
    config: [
      {
        key: 'BASE_SIZE',
        label: 'Light Size',
        type: 'slider',
        min: 60,
        max: 200,
        step: 10,
        default: 120
      },
      {
        key: 'SIZE_VARIATION',
        label: 'Size Variation',
        type: 'slider',
        min: 20,
        max: 120,
        step: 10,
        default: 80
      },
      {
        key: 'CENTER_AREA',
        label: 'Center Area',
        type: 'slider',
        min: 150,
        max: 500,
        step: 25,
        default: 300
      },
      {
        key: 'FLOAT_SPEED',
        label: 'Float Speed',
        type: 'slider',
        min: 0.02,
        max: 0.3,
        step: 0.01,
        default: 0.1
      },
      {
        key: 'FADE_DURATION',
        label: 'Fade Duration',
        type: 'slider',
        min: 2000,
        max: 10000,
        step: 500,
        default: 5000
      },
      {
        key: 'MAX_FORMS',
        label: 'Max Forms',
        type: 'number',
        min: 5,
        max: 40,
        step: 5,
        default: 20
      }
    ]
  },

  sphericalLens: {
    group: 'Natural Patterns',
    config: [
      {
        key: 'RADIUS',
        label: 'Lens Radius',
        type: 'slider',
        min: 100,
        max: 400,
        step: 10,
        default: 200
      },
      {
        key: 'LINES_PER_NOTE',
        label: 'Lines Per Note',
        type: 'number',
        min: 3,
        max: 20,
        step: 1,
        default: 8
      },
      {
        key: 'ABERRATION_STRENGTH',
        label: 'Aberration Strength',
        type: 'slider',
        min: 0.5,
        max: 3,
        step: 0.1,
        default: 1.0
      },
      {
        key: 'ORIENTATION',
        label: 'Orientation',
        type: 'select',
        options: [
          { value: 'horizontal', label: 'Horizontal' },
          { value: 'vertical', label: 'Vertical' }
        ],
        default: 'horizontal'
      },
      {
        key: 'LINE_LENGTH',
        label: 'Line Length',
        type: 'slider',
        min: 0,
        max: 2000,
        step: 50,
        default: 0,
        note: '0 = full canvas width/height'
      },
      {
        key: 'LINE_WIDTH',
        label: 'Line Width',
        type: 'slider',
        min: 0.5,
        max: 3,
        step: 0.1,
        default: 1.0
      },
      {
        key: 'LENS_WIDTH',
        label: 'Lens Width',
        type: 'slider',
        min: 0.5,
        max: 3,
        step: 0.1,
        default: 1.5
      },
      // { key: 'SHADOW_BLUR', label: 'Shadow Blur', type: 'slider', min: 0, max: 30, step: 1, default: 0 },
      {
        key: 'WAVE_SPEED',
        label: 'Wave Speed',
        type: 'slider',
        min: 0.1,
        max: 1,
        step: 0.05,
        default: 0.3
      },
      {
        key: 'WAVE_AMPLITUDE',
        label: 'Wave Amplitude',
        type: 'slider',
        min: 0,
        max: 20,
        step: 1,
        default: 5
      },
      {
        key: 'ROTATION_SPEED',
        label: 'Rotation Speed',
        type: 'slider',
        min: 0,
        max: 0.5,
        step: 0.05,
        default: 0.1
      },
      {
        key: 'SHOW_POINT_SOURCE',
        label: 'Show Point Source',
        type: 'checkbox',
        default: false
      },
      {
        key: 'USE_COLOR',
        label: 'Color Mode',
        type: 'checkbox',
        default: false
      },
      {
        key: 'CHROMATIC_ABERRATION',
        label: 'Chromatic Aberration',
        type: 'slider',
        min: 0,
        max: 30,
        step: 1,
        default: 0
      }
    ]
  },

  epitrochoid: {
    group: 'Natural Patterns',
    config: [
      {
        key: 'BASE_SIZE',
        label: 'Base Size',
        type: 'slider',
        min: 150,
        max: 1200,
        step: 5,
        default: 350
      },
      {
        key: 'GROWTH_RATE',
        label: 'Growth Rate',
        type: 'slider',
        min: 0,
        max: 0.5,
        step: 0.05,
        default: 0.2
      },
      {
        key: 'ROTATION_SPEED',
        label: 'Rotation Speed',
        type: 'slider',
        min: 0,
        max: 1,
        step: 0.05,
        default: 0.3
      },
      {
        key: 'SEGMENTS',
        label: 'Segments',
        type: 'number',
        min: 50,
        max: 400,
        step: 10,
        default: 200
      },
      {
        key: 'LINES_PER_NOTE',
        label: 'Lines Per Note',
        type: 'number',
        min: 1,
        max: 5,
        step: 1,
        default: 1
      },
      {
        key: 'DEPTH_PROJECTION',
        label: 'Depth Projection',
        type: 'slider',
        min: 0,
        max: 0.5,
        step: 0.05,
        default: 0.2
      },
      {
        key: 'LINE_WIDTH',
        label: 'Line Width',
        type: 'slider',
        min: 0.5,
        max: 2,
        step: 0.1,
        default: 1
      },
      {
        key: 'USE_3D_ROTATION',
        label: '3D Rotation',
        type: 'checkbox',
        default: true
      },
      {
        key: 'USE_COLOR',
        label: 'Color Mode',
        type: 'checkbox',
        default: false
      }
    ]
  },

  syncHelix2D: {
    group: '3D Geometry',
    config: [
      {
        key: 'ROTATION',
        label: 'Rotation',
        type: 'rotation',
        default: { x: 0, y: 0, z: 0 }
      },
      {
        key: 'ROTATION_ENABLED',
        label: 'Rotation Enabled',
        type: 'checkbox',
        default: true
      },
      {
        key: 'SEGMENTS',
        label: 'Segments',
        type: 'number',
        min: 20,
        max: 300,
        step: 10,
        default: 40
      },
      {
        key: 'AMPLITUDE',
        label: 'Amplitude',
        type: 'slider',
        min: 0,
        max: 300,
        step: 5,
        default: 200,
        note: '0 = auto (15% of canvas height)'
      },
      {
        key: 'FREQUENCY',
        label: 'Frequency',
        type: 'slider',
        min: 0.5,
        max: 5,
        step: 0.1,
        default: 2.2
      },
      {
        key: 'RADIUS',
        label: 'Cross-Section Radius',
        type: 'slider',
        min: 50,
        max: 100,
        step: 1,
        default: 81
      },
      {
        key: 'CROSS_SECTION_POINTS',
        label: 'Cross-Section Points',
        type: 'number',
        min: 4,
        max: 16,
        step: 1,
        default: 10
      },
      {
        key: 'SCALE',
        label: 'Scale',
        type: 'slider',
        min: 0.5,
        max: 2,
        step: 0.1,
        default: 1.0
      },
      {
        key: 'LINE_WIDTH',
        label: 'Line Width',
        type: 'slider',
        min: 0.3,
        max: 2,
        step: 0.1,
        default: 1.2
      },
      {
        key: 'ANIMATION_SPEED',
        label: 'Animation Speed',
        type: 'slider',
        min: 0.1,
        max: 2,
        step: 0.1,
        default: 0.5
      },
      {
        key: 'SYNC_RATE',
        label: 'Sync Rate',
        type: 'slider',
        min: 0.1,
        max: 2,
        step: 0.1,
        default: 0.7
      },
      {
        key: 'PERSPECTIVE',
        label: 'Rotation Angle',
        type: 'slider',
        min: 0,
        max: Math.PI * 2,
        step: 0.1,
        default: 0.2
      },
      {
        key: 'ENABLE_PROJECTION',
        label: 'Enable Projection',
        type: 'checkbox',
        default: true
      },
      {
        key: 'USE_COLOR',
        label: 'Color Mode',
        type: 'checkbox',
        default: false
      }
    ]
  },

  ramiel: {
    group: '3D Geometry',
    config: [
      {
        key: 'ROTATION',
        label: 'Rotation',
        type: 'rotation',
        default: { x: 0, y: 0, z: 0 }
      },
      {
        key: 'ROTATION_ENABLED',
        label: 'Rotation Enabled',
        type: 'checkbox',
        default: true
      },
      {
        key: 'SIZE',
        label: 'Size',
        type: 'slider',
        min: 50,
        max: 600,
        step: 10,
        default: 300
      },
      {
        key: 'SCALE',
        label: 'Scale',
        type: 'slider',
        min: 0.5,
        max: 2,
        step: 0.1,
        default: 1.0
      },
      {
        key: 'INSTANCES',
        label: 'Instances',
        type: 'number',
        min: 1,
        max: 4,
        step: 1,
        default: 1
      },
      {
        key: 'INSTANCE_SPACING',
        label: 'Instance Spacing',
        type: 'slider',
        min: 100,
        max: 400,
        step: 20,
        default: 200
      },
      {
        key: 'INSTANCE_PER_NOTE',
        label: 'Instance Per Note',
        type: 'checkbox',
        default: false
      },
      {
        key: 'ENABLE_ROTATION',
        label: 'Enable Rotation',
        type: 'checkbox',
        default: true
      },
      {
        key: 'ROTATION_SPEED',
        label: 'Rotation Speed',
        type: 'slider',
        min: 0,
        max: 3,
        step: 0.05,
        default: 0.3
      },
      {
        key: 'PERSPECTIVE',
        label: 'Perspective Angle',
        type: 'slider',
        min: 0,
        max: Math.PI * 2,
        step: 0.1,
        default: 0.2
      },
      {
        key: 'ENABLE_PROJECTION',
        label: 'Enable Projection',
        type: 'checkbox',
        default: true
      },
      {
        key: 'LINE_WIDTH',
        label: 'Line Width',
        type: 'slider',
        min: 0.3,
        max: 2,
        step: 0.1,
        default: 1.2
      },
      {
        key: 'USE_COLOR',
        label: 'Color Mode',
        type: 'checkbox',
        default: false
      },
      {
        key: 'SHAPESHIFTING_MODE',
        label: 'Shapeshifting Mode',
        type: 'checkbox',
        default: false
      },
      {
        key: 'SHAPESHIFTING_RATE',
        label: 'Shapeshifting Rate',
        type: 'slider',
        min: 0.1,
        max: 2,
        step: 0.1,
        default: 0.5
      },
      {
        key: 'SHAPESHIFTING_AMOUNT',
        label: 'Shapeshifting Amount',
        type: 'slider',
        min: 0,
        max: 100,
        step: 5,
        default: 30
      },
      {
        key: 'AT_FIELD_SIZE',
        label: 'AT Field Size',
        type: 'slider',
        min: 50,
        max: 300,
        step: 10,
        default: 120
      },
      {
        key: 'AT_FIELD_DURATION',
        label: 'AT Field Duration (ms)',
        type: 'slider',
        min: 500,
        max: 5000,
        step: 100,
        default: 2000
      },
      {
        key: 'AT_FIELD_FOLLOW_PROJECTION',
        label: 'AT Field Follow Projection',
        type: 'checkbox',
        default: false
      },
      {
        key: 'ENABLE_RAY',
        label: 'Enable Ray',
        type: 'checkbox',
        default: false
      },
      {
        key: 'RAY_LENGTH',
        label: 'Ray Length',
        type: 'slider',
        min: 100,
        max: 1000,
        step: 50,
        default: 400
      },
      {
        key: 'RAY_PULSE_RATE',
        label: 'Ray Pulse Rate',
        type: 'slider',
        min: 0.1,
        max: 3,
        step: 0.1,
        default: 1.0
      }
    ]
  },

  windmill: {
    group: '3D Geometry',
    config: [
      {
        key: 'ROTATION',
        label: 'Rotation',
        type: 'rotation',
        default: { x: 0, y: 0, z: 0 }
      },
      {
        key: 'ROTATION_ENABLED',
        label: 'Rotation Enabled',
        type: 'checkbox',
        default: true
      },
      {
        key: 'RADIUS',
        label: 'Radius',
        type: 'slider',
        min: 50,
        max: 200,
        step: 5,
        default: 50
      },
      {
        key: 'ROTATION_RATE',
        label: 'Rotation Rate',
        type: 'slider',
        min: 0.1,
        max: 2,
        step: 0.1,
        default: 0.4
      },
      {
        key: 'CHIRALITY',
        label: 'Chirality',
        type: 'slider',
        min: -1,
        max: 1,
        step: 2,
        default: 1,
        note: '-1 or 1'
      },
      {
        key: 'DEPTH',
        label: 'Depth',
        type: 'slider',
        min: 0,
        max: 0.5,
        step: 0.01,
        default: 0.1
      },
      {
        key: 'INSTANCE_COUNT',
        label: 'Instance Count',
        type: 'number',
        min: 1,
        max: 16,
        step: 1,
        default: 3
      },
      {
        key: 'SPACING',
        label: 'Spacing',
        type: 'slider',
        min: 100,
        max: 500,
        step: 10,
        default: 410
      },
      {
        key: 'SCALE',
        label: 'Scale',
        type: 'slider',
        min: 0.5,
        max: 2,
        step: 0.1,
        default: 1.0
      },
      {
        key: 'LINE_WIDTH',
        label: 'Line Width',
        type: 'slider',
        min: 0.3,
        max: 2,
        step: 0.1,
        default: 1.6
      },
      {
        key: 'BLADE_MULTIPLIER',
        label: 'Blade Multiplier',
        type: 'number',
        min: 1,
        max: 4,
        step: 1,
        default: 4,
        note: 'Blades per note'
      },
      {
        key: 'SPIRAL_SCALE',
        label: 'Spiral Scale',
        type: 'slider',
        min: 4,
        max: 15,
        step: 0.5,
        default: 5.0,
        note: 'Controls spiral tightness'
      },
      {
        key: 'GOLDEN_ANGLE',
        label: 'Golden Angle',
        type: 'slider',
        min: 2,
        max: 4,
        step: 0.1,
        default: 3.4,
        note: 'Spiral rotation angle'
      },
      {
        key: 'SIZE_VARIATION',
        label: 'Size Variation',
        type: 'slider',
        min: 0,
        max: 0.5,
        step: 0.01,
        default: 0.15
      },
      {
        key: 'BLADE_WIDTH',
        label: 'Blade Width',
        type: 'slider',
        min: 0.1,
        max: 0.8,
        step: 0.05,
        default: 0.5
      },
      {
        key: 'HUB_RADIUS',
        label: 'Hub Radius',
        type: 'slider',
        min: 3,
        max: 20,
        step: 1,
        default: 8
      },
      {
        key: 'ACCELERATION_FACTOR',
        label: 'Acceleration Factor',
        type: 'slider',
        min: 1,
        max: 5,
        step: 0.1,
        default: 3.4
      },
      {
        key: 'ACCELERATION_DURATION',
        label: 'Acceleration Duration (s)',
        type: 'slider',
        min: 0.1,
        max: 5,
        step: 0.1,
        default: 1.0
      },
      {
        key: 'PERSPECTIVE',
        label: 'Rotation Angle',
        type: 'slider',
        min: 0,
        max: Math.PI * 2,
        step: 0.1,
        default: 0.0
      },
      {
        key: 'ENABLE_PROJECTION',
        label: 'Enable Projection',
        type: 'checkbox',
        default: true
      },
      {
        key: 'USE_COLOR',
        label: 'Color Mode',
        type: 'checkbox',
        default: true
      }
    ]
  },

  orizuru: {
    group: '3D Geometry',
    config: [
      {
        key: 'ROTATION',
        label: 'Rotation',
        type: 'rotation',
        default: { x: 0, y: 0, z: 0 }
      },
      {
        key: 'ROTATION_ENABLED',
        label: 'Rotation Enabled',
        type: 'checkbox',
        default: true
      },
      {
        key: 'FOLD_AMOUNT',
        label: 'Fold Amount',
        type: 'slider',
        min: 0,
        max: 1,
        step: 0.01,
        default: 1.0,
        note: '0 = flat (SVG), 1 = folded (OBJ)'
      },
      {
        key: 'PERSPECTIVE',
        label: 'X Rotation',
        type: 'slider',
        min: 0,
        max: Math.PI * 2,
        step: 0.1,
        default: 3.0
      },
      {
        key: 'Y_ROTATION',
        label: 'Y Rotation',
        type: 'slider',
        min: 0,
        max: Math.PI * 2,
        step: 0.1,
        default: 0.0
      },
      {
        key: 'SCALE',
        label: 'Scale',
        type: 'slider',
        min: 100,
        max: 600,
        step: 10,
        default: 200
      },
      {
        key: 'LINE_WIDTH',
        label: 'Line Width',
        type: 'slider',
        min: 0.3,
        max: 2,
        step: 0.1,
        default: 0.6
      },
      {
        key: 'PROJECTION_DEPTH',
        label: 'Projection Depth',
        type: 'slider',
        min: 0,
        max: 1,
        step: 0.05,
        default: 0.3
      },
      {
        key: 'INSTANCES',
        label: 'Instances',
        type: 'number',
        min: 1,
        max: 8,
        step: 1,
        default: 1
      },
      {
        key: 'SPATIAL_RADIUS',
        label: 'Spatial Radius',
        type: 'slider',
        min: 100,
        max: 500,
        step: 10,
        default: 200
      },
      {
        key: 'ENABLE_PROJECTION',
        label: 'Enable Projection',
        type: 'checkbox',
        default: true
      },
      {
        key: 'USE_COLOR',
        label: 'Color Mode',
        type: 'checkbox',
        default: false
      }
    ]
  },

  deJong: {
    group: '3D Geometry',
    config: [
      {
        key: 'A',
        label: 'Parameter a',
        type: 'slider',
        min: -3,
        max: 3,
        step: 0.01,
        default: -1.5090717287003517
      },
      {
        key: 'B',
        label: 'Parameter b',
        type: 'slider',
        min: -3,
        max: 3,
        step: 0.01,
        default: -2.0
      },
      {
        key: 'C',
        label: 'Parameter c',
        type: 'slider',
        min: -3,
        max: 3,
        step: 0.01,
        default: -1.2
      },
      {
        key: 'D',
        label: 'Parameter d',
        type: 'slider',
        min: -3,
        max: 3,
        step: 0.01,
        default: 2.0
      },
      {
        key: 'SCALE',
        label: 'Scale',
        type: 'slider',
        min: 0.2,
        max: 1.5,
        step: 0.05,
        default: 0.9
      },
      {
        key: 'ITERATIONS',
        label: 'Iterations per Frame',
        type: 'number',
        min: 1000,
        max: 200000,
        step: 1000,
        default: 50000
      },
      {
        key: 'POINT_SIZE',
        label: 'Point Size',
        type: 'slider',
        min: 0.5,
        max: 4,
        step: 0.1,
        default: 1.5
      },
      {
        key: 'COLOR_MODE',
        label: 'Color Mode',
        type: 'select',
        options: [
          { value: 0, label: 'Rainbow' },
          { value: 1, label: 'MIDI' },
          { value: 2, label: 'Black & White' }
        ],
        default: 0
      }
    ]
  },
  squareTunnel: {
    group: 'Classic Patterns',
    config: [
      {
        key: 'USE_COLOR',
        label: 'Color Mode',
        type: 'checkbox',
        default: false
      },
      {
        key: 'LINE_WIDTH',
        label: 'Line Width',
        type: 'slider',
        min: 0.3,
        max: 5,
        step: 0.1,
        default: 1.0
      },
      {
        key: 'FIXED_LINE_COUNT',
        label: 'Line Count',
        type: 'number',
        min: 3,
        max: 80,
        step: 1,
        default: 20
      },
      {
        key: 'LINES_PER_NOTE_ENABLED',
        label: 'Lines Per Note Mode',
        type: 'checkbox',
        default: false
      },
      {
        key: 'LINES_PER_NOTE',
        label: 'Lines Per Note',
        type: 'number',
        min: 1,
        max: 20,
        step: 1,
        default: 5
      },
      {
        key: 'ANIMATION_SPEED',
        label: 'Animation Speed',
        type: 'slider',
        min: -5,
        max: 5,
        step: 0.1,
        default: 0.5,
        note: 'Negative = reverse direction'
      },
      {
        key: 'ROTATION_ANGLE',
        label: 'Rotation Angle',
        type: 'slider',
        min: 0,
        max: 180,
        step: 1,
        default: 0
      },
      {
        key: 'ROTATION_SPEED',
        label: 'Rotation Speed',
        type: 'slider',
        min: -3,
        max: 3,
        step: 0.05,
        default: 0
      },
      {
        key: 'SCALE',
        label: 'Scale',
        type: 'slider',
        min: 0.5,
        max: 2.0,
        step: 0.05,
        default: 1.0
      },
      {
        key: 'ASPECT_RATIO',
        label: 'Aspect Ratio',
        type: 'slider',
        min: 0.3,
        max: 3.0,
        step: 0.05,
        default: 1.0
      },
      {
        key: 'PERSPECTIVE',
        label: 'Perspective Mode',
        type: 'checkbox',
        default: false
      },
      {
        key: 'SHADOW_BLUR',
        label: 'Shadow Blur',
        type: 'slider',
        min: 0,
        max: 50,
        step: 1,
        default: 15
      }
    ]
  },

  moireCircles: {
    group: 'Classic Patterns',
    config: [
      {
        key: 'USE_COLOR',
        label: 'Color Mode',
        type: 'checkbox',
        default: false
      },
      {
        key: 'COLOR_BLEND',
        label: 'Screen Blend (color)',
        type: 'checkbox',
        default: true
      },
      {
        key: 'CIRCLE_COUNT_FROM_NOTES',
        label: 'Circle Count From Notes',
        type: 'checkbox',
        default: true
      },
      {
        key: 'FIXED_CIRCLE_COUNT',
        label: 'Fixed Circle Count',
        type: 'number',
        min: 1,
        max: 16,
        step: 1,
        default: 3
      },
      {
        key: 'SCALE',
        label: 'Scale',
        type: 'slider',
        min: 0.25,
        max: 2.5,
        step: 0.05,
        default: 1.0
      },
      {
        key: 'STRIPE_SPACING',
        label: 'Ring Spacing',
        type: 'slider',
        min: 3,
        max: 24,
        step: 0.5,
        default: 7
      },
      {
        key: 'MAX_RADIUS',
        label: 'Max Radius',
        type: 'slider',
        min: 80,
        max: 520,
        step: 5,
        default: 340
      },
      {
        key: 'LINE_WIDTH',
        label: 'Line Width',
        type: 'slider',
        min: 0.4,
        max: 3,
        step: 0.05,
        default: 1.0
      },
      {
        key: 'MOTION_RATE',
        label: 'Motion Rate',
        type: 'slider',
        min: 0,
        max: 3,
        step: 0.05,
        default: 1.0
      },
      {
        key: 'MOTION_MODE',
        label: 'Motion',
        type: 'select',
        options: [
          { value: 'orbit', label: 'Orbit & weave' },
          { value: 'lissajous', label: 'Lissajous drift' },
          { value: 'breathe', label: 'Breathe' },
          { value: 'drift', label: 'Slow drift' },
          { value: 'choreo', label: 'Pulse & intersect' }
        ],
        default: 'orbit'
      },
      {
        key: 'FORMATION_RADIUS',
        label: 'Formation Size',
        type: 'slider',
        min: 20,
        max: 320,
        step: 5,
        default: 130
      },
      {
        key: 'MOTION_AMPLITUDE',
        label: 'Motion Depth',
        type: 'slider',
        min: 0,
        max: 200,
        step: 2,
        default: 72
      },
      {
        key: 'RING_PHASE_SKEW',
        label: 'Ring Phase Skew',
        type: 'slider',
        min: 0,
        max: 6,
        step: 0.1,
        default: 1.2
      },
      {
        key: 'SHADOW_BLUR',
        label: 'Shadow Blur',
        type: 'slider',
        min: 0,
        max: 40,
        step: 1,
        default: 0
      }
    ]
  },

  doublePendulum: {
    group: 'Natural Patterns',
    config: [
      {
        key: 'USE_COLOR',
        label: 'Color Mode',
        type: 'checkbox',
        default: false
      },
      {
        key: 'COLOR_BLEND',
        label: 'Screen Blend (color)',
        type: 'checkbox',
        default: true
      },
      {
        key: 'PENDULUM_COUNT',
        label: 'Pendulums (side by side)',
        type: 'number',
        min: 1,
        max: 5,
        step: 1,
        default: 2
      },
      {
        key: 'RELEASE_FROM_REST',
        label: 'Hang & release (physical start, slower)',
        type: 'checkbox',
        default: false
      },
      {
        key: 'START_DIRECTION',
        label: 'Start side / spin bias',
        type: 'select',
        options: [
          { value: 'left', label: 'Left' },
          { value: 'right', label: 'Right' },
          { value: 'alternate', label: 'Alternate (L / R / L)' }
        ],
        default: 'right'
      },
      {
        key: 'LAUNCH_STRENGTH',
        label: 'Launch strength (impulse speed or pull depth)',
        type: 'slider',
        min: 0,
        max: 1000,
        step: 10,
        default: 480
      },
      {
        key: 'REST_TWIST',
        label: 'Arm twist at rest (chaos)',
        type: 'slider',
        min: 0,
        max: 0.45,
        step: 0.01,
        default: 0.1
      },
      {
        key: 'PENDULUM_PHASE_GAP',
        label: 'Extra twist per copy',
        type: 'slider',
        min: 0,
        max: 0.25,
        step: 0.005,
        default: 0.08
      },
      {
        key: 'ARM_LENGTH',
        label: 'Arm length',
        type: 'slider',
        min: 50,
        max: 150,
        step: 2,
        default: 95
      },
      {
        key: 'ARM_RATIO',
        label: 'Lower / upper arm length',
        type: 'slider',
        min: 0.55,
        max: 1.45,
        step: 0.02,
        default: 1.0
      },
      {
        key: 'MOTION_SPEED',
        label: 'Motion speed (impulse / kick mode)',
        type: 'slider',
        min: 0.35,
        max: 10,
        step: 0.05,
        default: 1.0
      },
      {
        key: 'MOTION_SPEED_HANG',
        label: 'Motion speed (hang & release)',
        type: 'slider',
        min: 0.35,
        max: 10,
        step: 0.05,
        default: 5.0
      },
      {
        key: 'DAMPING',
        label: 'Damping',
        type: 'slider',
        min: 0,
        max: 0.28,
        step: 0.002,
        default: 0.012
      },
      {
        key: 'HORIZONTAL_SPACING',
        label: 'Horizontal spacing',
        type: 'slider',
        min: 80,
        max: 420,
        step: 5,
        default: 210
      },
      {
        key: 'SCALE',
        label: 'Visual scale',
        type: 'slider',
        min: 0.4,
        max: 2.8,
        step: 0.05,
        default: 1.35
      },
      {
        key: 'SHOW_TRACE',
        label: 'Tip trace',
        type: 'checkbox',
        default: true
      },
      {
        key: 'TRACE_MAX_POINTS',
        label: 'Trace length',
        type: 'number',
        min: 400,
        max: 12000,
        step: 200,
        default: 4200
      },
      {
        key: 'SHOW_ARMS',
        label: 'Show arms',
        type: 'checkbox',
        default: true
      },
      {
        key: 'SHOW_JOINTS',
        label: 'Show joints',
        type: 'checkbox',
        default: true
      }
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
