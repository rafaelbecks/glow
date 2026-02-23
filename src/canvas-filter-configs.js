export const CANVAS_FILTER_CONFIGS = {
  clearAlpha: {
    levelOnly: true,
    enableKey: null,
    config: [
      { key: 'CLEAR_ALPHA', label: 'Level', type: 'slider', min: 0, max: 1, step: 0.01, default: 0.4 }
    ]
  },
  lumiaEffect: {
    levelOnly: true,
    enableKey: null,
    config: [
      { key: 'LUMIA_EFFECT', label: 'Level', type: 'slider', min: 0, max: 100, step: 1, default: 0 }
    ]
  },
  invertFilter: {
    levelOnly: true,
    enableKey: null,
    config: [
      { key: 'INVERT_FILTER', label: 'Level', type: 'slider', min: 0, max: 100, step: 1, default: 0 }
    ]
  },
  dither: {
    levelOnly: false,
    enableKey: 'DITHER_OVERLAY',
    config: [
      { key: 'DITHER_SATURATE', label: 'Saturation', type: 'slider', min: 0, max: 1, step: 0.01, default: 1 },
      { key: 'DITHER_TABLE_VALUES_R', label: 'Red Table', type: 'slider', min: 0, max: 1, step: 0.01, default: 0, tableValues: true },
      { key: 'DITHER_TABLE_VALUES_G', label: 'Green Table', type: 'slider', min: 0, max: 1, step: 0.01, default: 0, tableValues: true },
      { key: 'DITHER_TABLE_VALUES_B', label: 'Blue Table', type: 'slider', min: 0, max: 1, step: 0.01, default: 0, tableValues: true }
    ]
  }
}

export function getCanvasFilterConfig (filterId) {
  const entry = CANVAS_FILTER_CONFIGS[filterId]
  return entry ? entry.config : []
}

export function getCanvasFilterEnableKey (filterId) {
  const entry = CANVAS_FILTER_CONFIGS[filterId]
  return entry && entry.enableKey ? entry.enableKey : null
}

export function getCanvasFilterIds () {
  return Object.keys(CANVAS_FILTER_CONFIGS)
}

export function isCanvasFilterLevelOnly (filterId) {
  const entry = CANVAS_FILTER_CONFIGS[filterId]
  return entry ? entry.levelOnly : true
}

export function valueToTableValues (sliderValue) {
  const v = Math.max(0, Math.min(1, sliderValue))
  return `${v} ${1 - v}`
}

export function getCanvasFilterParamByKey (configKey) {
  for (const filterId of Object.keys(CANVAS_FILTER_CONFIGS)) {
    const param = CANVAS_FILTER_CONFIGS[filterId].config.find(p => p.key === configKey)
    if (param) return param
  }
  return null
}
