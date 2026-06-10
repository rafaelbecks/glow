export const SHADER_OVERLAY_CONFIGS = {
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
  if (entry.modeKey && entry.modeValue) {
    canvasSettings[entry.modeKey] = entry.modeValue
  }
}
