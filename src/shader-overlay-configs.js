export const SHADER_OVERLAY_CONFIGS = {
  glass: {
    enableKey: 'GLASS_OVERLAY_ENABLED',
    modeKey: 'GLASS_OVERLAY_MODE',
    modeValue: 'single',
    modeValues: ['single', 'bricks'],
    config: [
      {
        key: 'GLASS_OVERLAY_WIDTH',
        label: 'Width',
        type: 'slider',
        min: 20,
        max: 2000,
        step: 1,
        default: 200
      },
      {
        key: 'GLASS_OVERLAY_HEIGHT',
        label: 'Height',
        type: 'slider',
        min: 20,
        max: 2000,
        step: 1,
        default: 200
      },
      {
        key: 'GLASS_OVERLAY_RADIUS',
        label: 'Radius',
        type: 'slider',
        min: 2,
        max: 200,
        step: 1,
        default: 27
      },
      {
        key: 'GLASS_OVERLAY_THICKNESS',
        label: 'Thickness',
        type: 'slider',
        min: 1,
        max: 300,
        step: 1,
        default: 200
      },
      {
        key: 'GLASS_OVERLAY_BEZEL',
        label: 'Bezel',
        type: 'slider',
        min: 1,
        max: 120,
        step: 1,
        default: 60
      },
      {
        key: 'GLASS_OVERLAY_IOR',
        label: 'IOR',
        type: 'slider',
        min: 1,
        max: 3,
        step: 0.05,
        default: 3.0
      },
      {
        key: 'GLASS_OVERLAY_BLUR',
        label: 'Blur',
        type: 'slider',
        min: 0,
        max: 20,
        step: 0.1,
        default: 9.5
      },
      {
        key: 'GLASS_OVERLAY_SPECULAR',
        label: 'Specular',
        type: 'slider',
        min: 0,
        max: 1,
        step: 0.01,
        default: 0.35
      },
      {
        key: 'GLASS_OVERLAY_TINT',
        label: 'Tint',
        type: 'slider',
        min: 0,
        max: 1,
        step: 0.01,
        default: 0
      },
      {
        key: 'GLASS_OVERLAY_SHADOW',
        label: 'Shadow',
        type: 'slider',
        min: 0,
        max: 1,
        step: 0.01,
        default: 0.0
      },
      {
        key: 'GLASS_OVERLAY_BRICK_SIZE',
        label: 'Brick size',
        type: 'slider',
        min: 30,
        max: 600,
        step: 1,
        default: 200
      },
      {
        key: 'GLASS_OVERLAY_BRICK_OFFSET_X',
        label: 'Brick offset X',
        type: 'slider',
        min: -2000,
        max: 2000,
        step: 1,
        default: 0
      },
      {
        key: 'GLASS_OVERLAY_BRICK_OFFSET_Y',
        label: 'Brick offset Y',
        type: 'slider',
        min: -2000,
        max: 2000,
        step: 1,
        default: 0
      },
      {
        key: 'GLASS_OVERLAY_BRICK_GAP',
        label: 'Brick gap',
        type: 'slider',
        min: 0,
        max: 80,
        step: 1,
        default: 8
      }
    ]
  },
  rain: {
    enableKey: 'GLASS_OVERLAY_ENABLED',
    modeKey: 'GLASS_OVERLAY_MODE',
    modeValue: 'rain',
    config: [
      {
        key: 'SHADER_OVERLAY_RAIN_DISTORTION',
        label: 'Distortion',
        type: 'slider',
        min: 0,
        max: 0.2,
        step: 0.001,
        default: 0.05
      },
      {
        key: 'SHADER_OVERLAY_RAIN_SCALE',
        label: 'Drop scale',
        type: 'slider',
        min: 4,
        max: 80,
        step: 0.5,
        default: 25
      },
      {
        key: 'SHADER_OVERLAY_RAIN_TIME_SCALE',
        label: 'Time scale',
        type: 'slider',
        min: 0,
        max: 4,
        step: 0.05,
        default: 1
      },
      {
        key: 'SHADER_OVERLAY_RAIN_PATTERN_DRIFT',
        label: 'Pattern drift',
        type: 'slider',
        min: 0,
        max: 0.5,
        step: 0.005,
        default: 0.1
      },
      {
        key: 'SHADER_OVERLAY_RAIN_SHARPNESS',
        label: 'Sharpness',
        type: 'slider',
        min: 0.2,
        max: 4,
        step: 0.05,
        default: 1
      }
    ]
  }
}

export function getShaderOverlayConfig (overlayId) {
  const entry = SHADER_OVERLAY_CONFIGS[overlayId]
  return entry ? entry.config : []
}

export function getShaderOverlayIds () {
  return Object.keys(SHADER_OVERLAY_CONFIGS)
}

export function getShaderOverlayParamByKey (configKey) {
  for (const overlayId of Object.keys(SHADER_OVERLAY_CONFIGS)) {
    const param = SHADER_OVERLAY_CONFIGS[overlayId].config.find(
      (p) => p.key === configKey
    )
    if (param) return param
  }
  return null
}

export function activateShaderOverlay (canvasSettings, overlayId) {
  const entry = SHADER_OVERLAY_CONFIGS[overlayId]
  if (!entry || !canvasSettings) return

  if (entry.enableKey) {
    canvasSettings[entry.enableKey] = true
  }
  if (entry.modeKey) {
    const allowedModes = entry.modeValues || (entry.modeValue ? [entry.modeValue] : [])
    if (
      allowedModes.length > 0 &&
      !allowedModes.includes(canvasSettings[entry.modeKey])
    ) {
      canvasSettings[entry.modeKey] = allowedModes[0]
    }
  }
}
