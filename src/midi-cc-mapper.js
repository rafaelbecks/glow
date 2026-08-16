// MIDI CC (Control Change) mapping system for hardware control
// Provides declarative mapping of MIDI CC messages to GLOW parameters
import { getLuminodeConfig } from './luminode-configs.js'
import { getLuminodeSettingsKey } from './luminodes/index.js'
import {
  getCanvasFilterConfig,
  getCanvasFilterEnableKey,
  getCanvasFilterIds,
  getCanvasFilterParamByKey,
  valueToTableValues
} from './canvas-filter-configs.js'
import { SETTINGS } from './settings.js'

/** Ranges / types for SETTINGS.CANVAS keys controllable via MIDI CC */
const CANVAS_CC_META = {
  CLEAR_ALPHA: { min: 0, max: 1, type: 'number' },
  LUMIA_EFFECT: { min: 0, max: 100, type: 'number' },
  INVERT_FILTER: { min: 0, max: 100, type: 'number' },
  GRAYSCALE_FILTER: { min: 0, max: 100, type: 'number' },
  HUE_ROTATE_FILTER: { min: 0, max: 360, type: 'number' },
  BRIGHTNESS_FILTER: { min: 0, max: 200, type: 'number' },
  CONTRAST_FILTER: { min: 0, max: 200, type: 'number' },
  SATURATION_FILTER: { min: 0, max: 200, type: 'number' },
  CRT_MODE: { type: 'boolean' },
  CRT_INTENSITY: { min: 0, max: 100, type: 'number' },
  GRID_ENABLED: { type: 'boolean' },
  GRID_X_LINES: { min: 1, max: 50, type: 'number' },
  GRID_Y_LINES: { min: 1, max: 50, type: 'number' },
  NOISE_OVERLAY: { type: 'boolean' },
  NOISE_ANIMATE: { type: 'boolean' },
  NOISE_OPACITY: { min: 0, max: 1, type: 'number' },
  NOISE_DENSITY: { min: 0, max: 1, type: 'number' },
  NOISE_PATTERN_WIDTH: { min: 1, max: 500, type: 'number' },
  NOISE_PATTERN_HEIGHT: { min: 1, max: 500, type: 'number' },
  NOISE_WIDTH: { min: 1, max: 20, type: 'number' },
  NOISE_HEIGHT: { min: 1, max: 20, type: 'number' },
  DITHER_OVERLAY: { type: 'boolean' },
  DITHER_SATURATE: { min: 0, max: 1, type: 'number' },
  DITHER_TABLE_VALUES_R: { min: 0, max: 1, type: 'tableValues' },
  DITHER_TABLE_VALUES_G: { min: 0, max: 1, type: 'tableValues' },
  DITHER_TABLE_VALUES_B: { min: 0, max: 1, type: 'tableValues' },
  CHROMATIC_ABERRATION_ENABLED: { type: 'boolean' },
  CHROMATIC_ABERRATION_CONTRAST: { min: 0, max: 5, type: 'number' },
  SHADER_BACKGROUND_ENABLED: { type: 'boolean' },
  SHADER_BACKGROUND_TRAIL_LENGTH: { min: 1, max: 60, type: 'number' },
  SHADER_BACKGROUND_CURSOR_MODE: { type: 'boolean' }
}

const CANVAS_SETTING_LABELS = {
  CLEAR_ALPHA: 'Clear Alpha',
  LUMIA_EFFECT: 'Lumia Effect',
  INVERT_FILTER: 'Invert',
  GRAYSCALE_FILTER: 'Grayscale',
  HUE_ROTATE_FILTER: 'Hue Rotate',
  BRIGHTNESS_FILTER: 'Brightness',
  CONTRAST_FILTER: 'Contrast',
  SATURATION_FILTER: 'Saturation',
  DITHER_SATURATE: 'Dither Saturation'
}

function resolveCanvasMeta (setting) {
  if (CANVAS_CC_META[setting]) return CANVAS_CC_META[setting]
  const filterParam = getCanvasFilterParamByKey(setting)
  if (filterParam) {
    return {
      min: filterParam.min,
      max: filterParam.max,
      type: filterParam.tableValues ? 'tableValues' : 'number'
    }
  }
  return null
}

/** Mapping entries accept a single CC number or a list of alternatives. */
function matchesCc (configValue, cc) {
  if (Array.isArray(configValue)) return configValue.includes(cc)
  return configValue != null && Number(configValue) === cc
}

/** Built-in mapping files under `midi-mappings/` */
export const MIDI_CC_PRESETS = [
  {
    id: 'example-mapping.json',
    label: 'Example / Reference',
    path: 'midi-mappings/example-mapping.json'
  },
  {
    id: 'arturia-keylab-essential-49-mk3.json',
    label: 'Arturia KeyLab Essential 49 mk3',
    path: 'midi-mappings/arturia-keylab-essential-49-mk3.json'
  },
  {
    id: 'nanoKontrol2.json',
    label: 'Korg nanoKONTROL2',
    path: 'midi-mappings/nanoKontrol2.json'
  }
]

export class MIDICCMapper {
  constructor (trackManager, mainApp) {
    this.trackManager = trackManager
    this.mainApp = mainApp
    this.mapping = null
    this.deviceId = null
    this.deviceName = null
    this.enabled = false
    this.currentTrackId = null
    this.currentLuminode = null
    this.canvasFilterIndex = 0
    this.controlMode = 'luminode'
    this.canvasFilterLevels = new Map()
    this.sourceLabel = null
    this.presetId = null
  }

  loadMapping (mappingConfig) {
    this.mapping = mappingConfig
    this.canvasFilterIndex = 0
    this.controlMode = 'luminode'
    this.canvasFilterLevels.clear()
    this.deviceId = mappingConfig.device?.id || null
    this.deviceName = mappingConfig.device?.name || null
    if (mappingConfig.enabled !== undefined) {
      this.enabled = mappingConfig.enabled !== false
    }
    this.sourceLabel =
      mappingConfig.description ||
      mappingConfig.device?.name ||
      this.sourceLabel ||
      'Custom mapping'
    this.ensureCurrentTrack()
    this.publishTrackStatus()
    console.log('MIDI CC Mapping loaded:', {
      enabled: this.enabled,
      deviceId: this.deviceId,
      deviceName: this.deviceName,
      currentTrackId: this.currentTrackId,
      currentLuminode: this.currentLuminode
    })
  }

  setEnabled (enabled) {
    this.enabled = enabled
    if (enabled) this.ensureCurrentTrack()
    this.publishTrackStatus()
  }

  matchesDevice (deviceId, deviceName) {
    if (!this.enabled || !this.mapping) return false

    // Match by ID if specified
    if (this.deviceId && deviceId === this.deviceId) return true

    // Match by name if specified (case-insensitive partial match)
    if (this.deviceName && deviceName) {
      const nameLower = deviceName.toLowerCase()
      const matchNameLower = this.deviceName.toLowerCase()
      if (nameLower.includes(matchNameLower) || matchNameLower.includes(nameLower)) {
        return true
      }
    }

    return false
  }

  shouldSuppressNotes (deviceId, deviceName) {
    return Boolean(
      this.mapping?.suppressNotes &&
        this.matchesDevice(deviceId, deviceName)
    )
  }

  /**
   * Handle a MIDI CC message
   * @param {number} cc - CC number (0-127)
   * @param {number} value - CC value (0-127)
   * @param {string} deviceId - MIDI device ID
   * @param {string} deviceName - MIDI device name
   */
  handleCC (cc, value, deviceId, deviceName) {
    if (!this.enabled || !this.mapping) return
    if (!this.matchesDevice(deviceId, deviceName)) return

    const normalizedValue = value / 127 // Normalize to 0-1
    this.ensureCurrentTrack()
    let handled = false

    handled = this.handleModeToggle('cc', cc, value > 64) || handled
    handled = this.handleLayoutModeToggle('cc', cc, value > 64) || handled
    handled = this.handleLuminodeNavigation('cc', cc, value > 64) || handled
    handled = this.handleCanvasFilterNavigation('cc', cc, value > 64) || handled
    handled = this.handleUseColorToggle('cc', cc, value > 64) || handled

    if (this.mapping.trackSelection) {
      handled = this.handleTrackSelection(cc, value) || handled
    }

    if (this.mapping.trackNavigation) {
      handled = this.handleTrackNavigation(cc, value) || handled
    }

    if (this.mapping.luminodeSelection && this.mapping.luminodeSelection.cc === cc) {
      this.handleLuminodeSelection(value)
      handled = true
    }

    if (this.currentTrackId && this.currentLuminode && this.mapping.luminodeParameters) {
      handled = this.handleLuminodeParameters(cc, normalizedValue) || handled
    }

    if (this.currentTrackId && this.mapping.layout) {
      handled = this.handleLayout(cc, normalizedValue) || handled
    }

    if (this.currentTrackId && this.mapping.motion) {
      handled = this.handleMotion(cc, normalizedValue) || handled
    }

    if (this.mapping.mixer) {
      handled = this.handleMixer(cc, value, normalizedValue) || handled
    }

    if (this.mapping.canvas) {
      handled = this.handleCanvas(cc, normalizedValue) || handled
    }

    if (this.mapping.canvasFilterCycle) {
      handled = this.handleCanvasFilterCycle(cc, value, normalizedValue) || handled
    }

    if (!handled) {
      console.log('[MIDI CC] Unmapped control — use this CC number in the mapping file', {
        cc,
        value,
        deviceName,
        currentTrackId: this.currentTrackId
      })
    }
  }

  /**
   * Controls that act on "the selected track" need a target before any button
   * has been pressed, so fall back to the lowest-numbered track.
   */
  ensureCurrentTrack () {
    const tracks = this.trackManager.getTracks()
    if (!tracks || tracks.length === 0) return

    const current = this.currentTrackId
      ? tracks.find((track) => track.id === this.currentTrackId)
      : null

    const previousTrackId = this.currentTrackId
    const previousLuminode = this.currentLuminode

    if (!current) {
      const first = [...tracks].sort((a, b) => a.id - b.id)[0]
      this.currentTrackId = first.id
      this.currentLuminode = first.luminode
    } else {
      this.currentLuminode = current.luminode
    }

    if (
      previousTrackId !== this.currentTrackId ||
      previousLuminode !== this.currentLuminode
    ) {
      this.publishTrackStatus()
    }
  }

  handlePitchBend (lsb, msb, channel, deviceId, deviceName) {
    if (!this.enabled || !this.mapping) return
    if (!this.matchesDevice(deviceId, deviceName)) return
    this.ensureCurrentTrack()
    if (!this.currentTrackId) return

    const normalizedValue = ((msb << 7) | lsb) / 16383
    if (this.controlMode === 'canvas') {
      this.applyCanvasFilterParameter(channel, normalizedValue)
      return
    }

    if (this.controlMode === 'layout') {
      this.applyLayoutModeParameter(channel, normalizedValue)
      return
    }

    const parameterChannels =
      this.mapping.luminodeParameters?.pitchBendChannels
    const sliderIndex = Array.isArray(parameterChannels)
      ? parameterChannels.indexOf(channel)
      : -1

    if (sliderIndex !== -1) {
      const parameterIndex = this.getCcParameterCount() + sliderIndex
      this.applyLuminodeParameter(
        parameterIndex,
        normalizedValue,
        `slider ${channel + 1}`
      )
      return
    }

    const layoutParam = this.mapping.pitchBendLayout?.[String(channel)]
    if (layoutParam) {
      this.applyLayoutParameter(
        layoutParam,
        normalizedValue,
        `slider ${channel + 1}`
      )
      return
    }

    if (
      channel ===
      this.mapping.canvasFilterCycle?.levelPitchBendChannel
    ) {
      this.applyCanvasFilterLevel(
        normalizedValue,
        `slider ${channel + 1}`
      )
      return
    }

    console.log('[MIDI CC] Unmapped pitch bend channel', {
      channel,
      value: Number(normalizedValue.toFixed(3))
    })
  }

  /**
   * Buttons that report as notes rather than CC (nanoKONTROL2 transport row).
   */
  handleNote (note, velocity, isNoteOn, deviceId, deviceName) {
    if (!this.enabled || !this.mapping) return false
    if (!this.matchesDevice(deviceId, deviceName)) return false

    const navigation = this.mapping.trackNavigation
    const isPrevious = matchesCc(navigation?.previousNote, note)
    const isNext = matchesCc(navigation?.nextNote, note)
    const isDice = matchesCc(this.mapping.generatorDice?.note, note)
    const isModeToggle = matchesCc(this.mapping.modeToggle?.note, note)
    const isLayoutMode = matchesCc(this.mapping.layoutModeToggle?.note, note)
    const isUseColor = matchesCc(this.mapping.useColorToggle?.note, note)
    const luminodeNavigation = this.mapping.luminodeNavigation
    const isPreviousLuminode = matchesCc(
      luminodeNavigation?.previousNote,
      note
    )
    const isNextLuminode = matchesCc(luminodeNavigation?.nextNote, note)
    const filterNavigation = this.mapping.canvasFilterNavigation
    const isPreviousFilter = matchesCc(filterNavigation?.previousNote, note)
    const isNextFilter = matchesCc(filterNavigation?.nextNote, note)

    if (
      !isPrevious &&
      !isNext &&
      !isDice &&
      !isModeToggle &&
      !isLayoutMode &&
      !isUseColor &&
      !isPreviousLuminode &&
      !isNextLuminode &&
      !isPreviousFilter &&
      !isNextFilter
    ) {
      console.log('[MIDI CC] Unmapped note — use this note number in the mapping file', {
        note,
        velocity,
        isNoteOn,
        deviceName
      })
      return false
    }

    // Buttons send press (127) then release (0); only act on the press.
    if (!isNoteOn || velocity <= 0) return true

    if (isPrevious || isNext) {
      this.stepTrack(isNext ? 1 : -1, `note ${note}`)
      return true
    }

    if (isModeToggle) {
      this.toggleControlMode()
      return true
    }

    if (isLayoutMode) {
      this.toggleLayoutMode()
      return true
    }

    if (isUseColor) {
      this.toggleUseColor(`note ${note}`)
      return true
    }

    if (isPreviousLuminode || isNextLuminode) {
      this.stepLuminode(isNextLuminode ? 1 : -1, `note ${note}`)
      return true
    }

    if (isPreviousFilter || isNextFilter) {
      if (this.controlMode === 'canvas') {
        this.stepCanvasFilter(isNextFilter ? 1 : -1, `note ${note}`)
      }
      return true
    }

    this.triggerGeneratorDice(`note ${note}`)
    return true
  }

  handleModeToggle (messageType, number, isPressed) {
    const mapped = this.mapping.modeToggle?.[messageType]
    if (!matchesCc(mapped, number)) return false
    if (isPressed) this.toggleControlMode()
    return true
  }

  handleLayoutModeToggle (messageType, number, isPressed) {
    const mapped = this.mapping.layoutModeToggle?.[messageType]
    if (!matchesCc(mapped, number)) return false
    if (isPressed) this.toggleLayoutMode()
    return true
  }

  handleUseColorToggle (messageType, number, isPressed) {
    const mapped = this.mapping.useColorToggle?.[messageType]
    if (!matchesCc(mapped, number)) return false
    if (isPressed) this.toggleUseColor(`${messageType} ${number}`)
    return true
  }

  toggleUseColor (source = '') {
    this.ensureCurrentTrack()
    if (!this.currentLuminode) return

    const colorParam = getLuminodeConfig(this.currentLuminode).find(
      (param) => param.key === 'USE_COLOR'
    )
    if (!colorParam) {
      this.showControlMessage(
        `${this.currentLuminode} has no color mode`,
        true
      )
      return
    }

    const settingsKey = getLuminodeSettingsKey(this.currentLuminode)
    const moduleConfig = settingsKey ? SETTINGS.MODULES[settingsKey] : null
    if (!moduleConfig || typeof moduleConfig.USE_COLOR !== 'boolean') {
      this.showControlMessage(
        `${this.currentLuminode} has no color mode`,
        true
      )
      return
    }

    const nextValue = !moduleConfig.USE_COLOR
    this.mainApp?.updateLuminodeConfig?.({
      luminode: this.currentLuminode,
      param: 'USE_COLOR',
      value: nextValue
    })
    this.showControlMessage(
      `${colorParam.label}: ${nextValue ? 'on' : 'off'}${
        source ? ` · ${source}` : ''
      }`
    )
    console.log('[MIDI CC] Use color toggle', {
      source,
      luminode: this.currentLuminode,
      value: nextValue
    })
  }

  handleLuminodeNavigation (messageType, number, isPressed) {
    const navigation = this.mapping.luminodeNavigation
    const suffix = messageType === 'cc' ? 'CC' : 'Note'
    const isPrevious = matchesCc(navigation?.[`previous${suffix}`], number)
    const isNext = matchesCc(navigation?.[`next${suffix}`], number)
    if (!isPrevious && !isNext) return false
    if (isPressed && this.controlMode !== 'canvas') {
      this.stepLuminode(isNext ? 1 : -1, `${messageType} ${number}`)
    }
    return true
  }

  handleCanvasFilterNavigation (messageType, number, isPressed) {
    const navigation = this.mapping.canvasFilterNavigation
    const suffix = messageType === 'cc' ? 'CC' : 'Note'
    const isPrevious = matchesCc(navigation?.[`previous${suffix}`], number)
    const isNext = matchesCc(navigation?.[`next${suffix}`], number)
    if (!isPrevious && !isNext) return false
    if (isPressed && this.controlMode === 'canvas') {
      this.stepCanvasFilter(isNext ? 1 : -1, `${messageType} ${number}`)
    }
    return true
  }

  toggleControlMode () {
    // Cycle stays between luminode params and canvas filters.
    this.controlMode = this.controlMode === 'canvas' ? 'luminode' : 'canvas'
    this.publishTrackStatus()
    this.showControlMessage(
      this.controlMode === 'canvas'
        ? `canvas · ${this.getSelectedCanvasFilterLabel()}`
        : `luminode · ${this.currentLuminode}`,
      true
    )
  }

  toggleLayoutMode () {
    this.controlMode =
      this.controlMode === 'layout' ? 'luminode' : 'layout'
    this.publishTrackStatus()
    this.showControlMessage(
      this.controlMode === 'layout'
        ? `layout${this.has3dRotation() ? ' · 3d' : ''}`
        : `luminode · ${this.currentLuminode}`,
      true
    )
  }

  has3dRotation () {
    if (!this.currentLuminode) return false
    return getLuminodeConfig(this.currentLuminode).some(
      (param) => param.key === 'ROTATION' && param.type === 'rotation'
    )
  }

  stepLuminode (direction, source = '') {
    this.ensureCurrentTrack()
    if (!this.currentTrackId) return

    const luminodes = this.trackManager.getAvailableLuminodes()
    if (!Array.isArray(luminodes) || luminodes.length === 0) return

    const currentIndex = luminodes.indexOf(this.currentLuminode)
    const nextIndex =
      currentIndex === -1
        ? direction > 0
          ? 0
          : luminodes.length - 1
        : (currentIndex + direction + luminodes.length) % luminodes.length
    const luminode = luminodes[nextIndex]

    this.trackManager.setLuminode(this.currentTrackId, luminode)
    this.currentLuminode = luminode
    this.publishTrackStatus()
    this.showControlMessage(
      `track ${this.currentTrackId} · ${luminode}`,
      true
    )
    console.log('[MIDI CC] Luminode navigation', {
      source,
      trackId: this.currentTrackId,
      luminode
    })
  }

  getCanvasFilterIds () {
    const configured = this.mapping?.canvasFilterNavigation?.filters
    return Array.isArray(configured) && configured.length > 0
      ? configured
      : getCanvasFilterIds()
  }

  getSelectedCanvasFilterId () {
    if (!this.mapping) return null
    const filters = this.getCanvasFilterIds()
    return filters[this.canvasFilterIndex] || null
  }

  getSelectedCanvasFilterLabel () {
    const filterId = this.getSelectedCanvasFilterId()
    return filterId ? this.getCanvasFilterLabel(filterId) : 'no filter'
  }

  stepCanvasFilter (direction, source = '') {
    const filters = this.getCanvasFilterIds()
    if (filters.length === 0) return

    this.canvasFilterIndex =
      (this.canvasFilterIndex + direction + filters.length) % filters.length
    this.publishTrackStatus()
    this.showControlMessage(
      `canvas · ${this.getSelectedCanvasFilterLabel()}`,
      true
    )
    console.log('[MIDI CC] Canvas filter navigation', {
      source,
      filterId: this.getSelectedCanvasFilterId()
    })
  }

  triggerGeneratorDice (source = '') {
    this.ensureCurrentTrack()
    if (!this.currentTrackId) return

    const result = this.mainApp?.midiGenerator?.ensureOrRandomizeForTrack(
      this.currentTrackId
    )
    if (!result) {
      this.showControlMessage(
        `track ${this.currentTrackId} · generator unavailable`,
        true
      )
      return
    }

    this.showControlMessage(
      `track ${this.currentTrackId} · generator ${result}`,
      true
    )
    console.log('[MIDI CC] Generator dice', {
      source,
      trackId: this.currentTrackId,
      result
    })
  }

  /**
   * Move the selection by `direction` steps through the tracks, wrapping around.
   */
  stepTrack (direction, source = '') {
    const tracks = this.trackManager
      .getTracks()
      .slice()
      .sort((a, b) => a.id - b.id)
    if (tracks.length === 0) return

    const currentIndex = tracks.findIndex(
      (track) => track.id === this.currentTrackId
    )
    const nextIndex =
      currentIndex === -1
        ? direction > 0
          ? 0
          : tracks.length - 1
        : (currentIndex + direction + tracks.length) % tracks.length
    const track = tracks[nextIndex]

    this.currentTrackId = track.id
    this.currentLuminode = track.luminode
    this.publishTrackStatus()
    this.showControlMessage(
      `track ${track.id}${track.luminode ? ` · ${track.luminode}` : ''}`,
      true
    )
    console.log('[MIDI CC] Track navigation', {
      source,
      trackId: track.id,
      luminode: track.luminode
    })
  }

  /**
   * Keep a persistent "selected track" line on the debug overlay so the
   * hardware selection is visible without pressing anything.
   */
  publishTrackStatus () {
    if (!this.mainApp?.setMidiControlStatus) return

    if (!this.enabled || !this.mapping || !this.currentTrackId) {
      this.mainApp.setMidiControlStatus(null)
      return
    }

    this.mainApp.setMidiControlStatus(
      this.controlMode === 'canvas'
        ? `midi · canvas · ${this.getSelectedCanvasFilterLabel()}`
        : this.controlMode === 'layout'
          ? `midi · layout${this.has3dRotation() ? ' · 3d' : ''} · track ${
              this.currentTrackId
            }`
          : `midi · track ${this.currentTrackId}${
              this.currentLuminode ? ` · ${this.currentLuminode}` : ''
            }`
    )
  }

  handleTrackSelection (cc, value) {
    const trackMapping = this.mapping.trackSelection
    if (!trackMapping) return false

    // Check if this CC is mapped to a track
    for (const [trackIdStr, trackCC] of Object.entries(trackMapping)) {
      const trackId = parseInt(trackIdStr)
      if (trackCC === cc) {
        // Value > 64 activates the track for parameter control
        const track = this.trackManager.getTrack(trackId)
        if (track && value > 64) {
          this.currentTrackId = trackId
          this.currentLuminode = track.luminode
          this.showControlMessage(`track ${trackId} active`)
        }
        return true
      }
    }

    return false
  }

  handleTrackNavigation (cc, value) {
    const navigation = this.mapping.trackNavigation
    const isPrevious = matchesCc(navigation.previous, cc)
    const isNext = matchesCc(navigation.next, cc)
    if (!isPrevious && !isNext) return false

    // Buttons report press (127) and release (0); acting on release would undo
    // the press, and it also lets a single button double as "next track".
    if (value <= 64) return true

    this.stepTrack(isNext ? 1 : -1, `CC ${cc}`)
    return true
  }

  handleLuminodeSelection (value) {
    if (!this.currentTrackId) return

    const availableLuminodes = this.trackManager.getAvailableLuminodes()
    const index = Math.floor((value / 127) * availableLuminodes.length)
    const selectedLuminode = availableLuminodes[Math.min(index, availableLuminodes.length - 1)]

    if (selectedLuminode) {
      this.trackManager.setLuminode(this.currentTrackId, selectedLuminode)
      this.currentLuminode = selectedLuminode
      this.publishTrackStatus()
      this.showControlMessage(`luminode: ${selectedLuminode}`)
    }
  }

  handleLuminodeParameters (cc, normalizedValue) {
    if (!this.mapping.luminodeParameters || !this.currentLuminode) {
      return false
    }

    // CC control is opt-in: without an explicit range, knobs stay unmapped and
    // parameters are driven by pitch bend alone.
    const paramConfig = this.mapping.luminodeParameters
    if (paramConfig.start == null) return false

    const startCC = paramConfig.start
    const maxCC = paramConfig.max ?? 127

    if (cc < startCC || cc > maxCC) {
      return false
    }

    const paramIndex = cc - startCC
    this.applyLuminodeParameter(paramIndex, normalizedValue, `CC ${cc}`)
    return true
  }

  getCcParameterCount () {
    const paramConfig = this.mapping?.luminodeParameters
    if (!paramConfig || paramConfig.start == null) return 0
    const maxCC = paramConfig.max ?? paramConfig.start - 1
    return Math.max(0, maxCC - paramConfig.start + 1)
  }

  getMappableLuminodeParameters () {
    if (!this.currentLuminode) return []
    return getLuminodeConfig(this.currentLuminode).filter(
      (param) =>
        param.key !== 'USE_COLOR' &&
        (param.type === 'slider' ||
          param.type === 'number' ||
          param.type === 'checkbox')
    )
  }

  applyLuminodeParameter (paramIndex, normalizedValue, source = '') {
    const luminodeConfig = this.getMappableLuminodeParameters()
    if (!luminodeConfig || luminodeConfig.length === 0) {
      console.log('[MIDI CC] Luminode parameters: no config found', { luminode: this.currentLuminode })
      return
    }

    if (paramIndex >= luminodeConfig.length) {
      console.log('[MIDI CC] No luminode parameter for control', {
        source,
        luminode: this.currentLuminode,
        paramIndex,
        parameterCount: luminodeConfig.length
      })
      return
    }

    const param = luminodeConfig[paramIndex]
    if (!param) {
      return
    }

    // Map normalized value to parameter range
    let paramValue
    if (param.type === 'number') {
      // For number types, round to nearest step
      const step = param.step || 1
      const steps = (param.max - param.min) / step
      const stepIndex = Math.round(normalizedValue * steps)
      paramValue = param.min + (stepIndex * step)
    } else if (param.type === 'checkbox') {
      // For checkboxes, use threshold (value > 64 = true)
      paramValue = normalizedValue > 0.5
    } else {
      // For slider types, use continuous mapping
      paramValue = param.min + (normalizedValue * (param.max - param.min))
    }

    if (this.mainApp && this.mainApp.updateLuminodeConfig) {
      this.mainApp.updateLuminodeConfig({
        luminode: this.currentLuminode,
        param: param.key,
        value: paramValue
      })

      const displayValue =
        typeof paramValue === 'number'
          ? Number(paramValue.toFixed(3))
          : paramValue
      this.showControlMessage(
        `${param.label}: ${displayValue}${source ? ` · ${source}` : ''}`
      )
      console.log('[MIDI CC] Luminode parameter', {
        source,
        trackId: this.currentTrackId,
        luminode: this.currentLuminode,
        parameter: param.label,
        key: param.key,
        value: paramValue
      })
    } else {
      console.warn('[MIDI CC] Luminode parameters: mainApp or updateLuminodeConfig not available')
    }
  }

  handleLayout (cc, normalizedValue) {
    if (!this.mapping.layout) return false

    const layoutMapping = this.mapping.layout
    // Convert CC to string for JSON key lookup
    const layoutParam = layoutMapping[String(cc)]
    if (!layoutParam || !this.currentTrackId) return false

    this.applyLayoutParameter(layoutParam, normalizedValue, `CC ${cc}`)
    return true
  }

  applyLayoutParameter (layoutParam, normalizedValue, source = '') {
    const track = this.trackManager.getTrack(this.currentTrackId)
    if (!track) return

    const currentLayout = track.layout || { x: 0, y: 0, rotation: 0 }
    const axis = layoutParam === 'z' ? 'rotation' : layoutParam
    let newValue
    if (axis === 'x' || axis === 'y') {
      newValue = (normalizedValue - 0.5) * 1000
    } else if (axis === 'rotation') {
      newValue = (normalizedValue - 0.5) * 360
    } else {
      return
    }

    this.trackManager.setLayout(this.currentTrackId, {
      ...currentLayout,
      [axis]: newValue
    })
    const label = layoutParam === 'z' ? 'Z' : layoutParam.toUpperCase()
    const displayValue =
      axis === 'rotation'
        ? `${newValue.toFixed(1)}°`
        : newValue.toFixed(1)
    this.showControlMessage(
      `${label}: ${displayValue}${source ? ` · ${source}` : ''}`
    )
    console.log('[MIDI CC] Layout parameter', {
      source,
      trackId: this.currentTrackId,
      parameter: axis,
      value: newValue
    })
  }

  /**
   * Layout-mode bank: sliders 1–3 = layout X/Y/Z, sliders 4–6 = 3D ROTATION
   * X/Y/Z when the current luminode exposes a ROTATION parameter.
   */
  applyLayoutModeParameter (channel, normalizedValue) {
    const source = `slider ${channel + 1}`
    if (channel <= 2) {
      const axis = ['x', 'y', 'z'][channel]
      this.applyLayoutParameter(axis, normalizedValue, source)
      return
    }

    if (channel <= 5) {
      if (!this.has3dRotation()) {
        console.log('[MIDI CC] Layout mode: no 3D rotation on luminode', {
          luminode: this.currentLuminode,
          slider: channel + 1
        })
        return
      }
      const axis = ['x', 'y', 'z'][channel - 3]
      this.apply3dRotationAxis(axis, normalizedValue, source)
      return
    }

    console.log('[MIDI CC] Layout mode: unused slider', {
      slider: channel + 1
    })
  }

  apply3dRotationAxis (axis, normalizedValue, source = '') {
    if (!this.currentLuminode) return

    const settingsKey = getLuminodeSettingsKey(this.currentLuminode)
    const moduleConfig = settingsKey ? SETTINGS.MODULES[settingsKey] : null
    if (!moduleConfig) return

    const current =
      moduleConfig.ROTATION && typeof moduleConfig.ROTATION === 'object'
        ? { ...moduleConfig.ROTATION }
        : { x: 0, y: 0, z: 0 }
    const newValue = (normalizedValue - 0.5) * 360
    current[axis] = newValue

    this.mainApp?.updateLuminodeConfig?.({
      luminode: this.currentLuminode,
      param: 'ROTATION',
      value: current
    })
    this.showControlMessage(
      `3D ${axis.toUpperCase()}: ${newValue.toFixed(1)}°${
        source ? ` · ${source}` : ''
      }`
    )
    console.log('[MIDI CC] 3D rotation', {
      source,
      luminode: this.currentLuminode,
      axis,
      value: newValue,
      rotation: current
    })
  }

  handleMotion (cc, normalizedValue) {
    if (!this.mapping.motion) return false

    const motionMapping = this.mapping.motion
    // Convert CC to string for JSON key lookup
    const motionParam = motionMapping[String(cc)]

    if (motionParam && this.currentTrackId) {
      const config = this.trackManager.getTrajectoryConfig(this.currentTrackId)
      if (config) {
        const updates = {}

        // Map CC to trajectory parameters
        if (motionParam === 'enabled') {
          updates.enabled = normalizedValue > 0.5
        } else if (motionParam === 'motionRate') {
          updates.motionRate = normalizedValue * 2 // 0 to 2
        } else if (motionParam === 'amplitude') {
          updates.amplitude = normalizedValue * 200 // 0 to 200
        } else if (motionParam === 'trajectoryType') {
          const types = this.trackManager.getTrajectoryTypes()
          const index = Math.floor(normalizedValue * types.length)
          updates.trajectoryType = types[Math.min(index, types.length - 1)]
        }

        if (Object.keys(updates).length > 0) {
          this.trackManager.updateTrajectoryConfig(this.currentTrackId, updates)
        }
      }
      return true
    }

    return false
  }

  /**
   * Mixer strip controls — absolute mute/solo (CC > 64 = on) and opacity faders.
   * Config shape:
   *   "mixer": {
   *     "opacity": { "1": 14, "2": 15 },
   *     "mute":    { "1": 23, "2": 24 },
   *     "solo":    { "1": 27, "2": 28 }
   *   }
   */
  handleMixer (cc, value, normalizedValue) {
    const mixer = this.mapping.mixer
    if (!mixer) return false

    const matchTrack = (section) => {
      if (!section) return null
      for (const [trackIdStr, mappedCC] of Object.entries(section)) {
        if (Number(mappedCC) === cc) return parseInt(trackIdStr, 10)
      }
      return null
    }

    const opacityTrack = matchTrack(mixer.opacity)
    if (opacityTrack != null) {
      this.trackManager.setTrackOpacity(opacityTrack, normalizedValue)
      this.showControlMessage(
        `mixer T${opacityTrack} opacity: ${normalizedValue.toFixed(2)}`
      )
      return true
    }

    const muteTrack = matchTrack(mixer.mute)
    if (muteTrack != null) {
      const muted = value > 64
      this.trackManager.setTrackMuted(muteTrack, muted)
      this.showControlMessage(
        `mixer T${muteTrack} ${muted ? 'mute' : 'unmute'}`
      )
      return true
    }

    const soloTrack = matchTrack(mixer.solo)
    if (soloTrack != null) {
      const solo = value > 64
      this.trackManager.setTrackSolo(soloTrack, solo)
      this.showControlMessage(
        `mixer T${soloTrack} solo ${solo ? 'on' : 'off'}`
      )
      return true
    }

    return false
  }

  /**
   * Canvas / color-filter settings.
   * Config shape: "canvas": { "60": "CLEAR_ALPHA", "62": "INVERT_FILTER", ... }
   * Values are SETTINGS.CANVAS keys. Booleans use CC > 64; numbers map 0–127 → min–max.
   */
  handleCanvas (cc, normalizedValue) {
    const canvasMapping = this.mapping.canvas
    if (!canvasMapping) return false

    const setting = canvasMapping[String(cc)]
    if (!setting) return false

    const meta = resolveCanvasMeta(setting)
    if (!meta) {
      console.warn(`[MIDI CC] Unknown canvas setting: ${setting}`)
      return true
    }

    let value
    if (meta.type === 'boolean') {
      value = normalizedValue > 0.5
    } else if (meta.type === 'tableValues') {
      value = valueToTableValues(normalizedValue)
    } else {
      const min = meta.min ?? 0
      const max = meta.max ?? 1
      value = min + normalizedValue * (max - min)
    }

    if (this.mainApp?.updateCanvasSetting) {
      this.mainApp.updateCanvasSetting({ setting, value })
      const display =
        typeof value === 'number' ? Number(value.toFixed(3)) : value
      this.showControlMessage(
        `${this.getCanvasSettingLabel(setting)}: ${display}`
      )
    }

    return true
  }

  handleCanvasFilterCycle (cc, value, normalizedValue) {
    const config = this.mapping.canvasFilterCycle
    const settings = Array.isArray(config.settings) ? config.settings : []
    if (settings.length === 0) return false

    if (matchesCc(config.cycleCC, cc)) {
      if (value <= 64) return true
      this.canvasFilterIndex = (this.canvasFilterIndex + 1) % settings.length
      this.showControlMessage(
        `filter: ${this.getCanvasSettingLabel(
          settings[this.canvasFilterIndex]
        )}`,
        true
      )
      return true
    }

    if (!matchesCc(config.levelCC, cc)) return false
    this.applyCanvasFilterLevel(normalizedValue, `CC ${cc}`)
    return true
  }

  applyCanvasFilterParameter (channel, normalizedValue) {
    const filterId = this.getSelectedCanvasFilterId()
    if (!filterId) return

    const config = getCanvasFilterConfig(filterId)
    const enableKey = getCanvasFilterEnableKey(filterId)
    if (channel === 0) {
      this.applyCanvasFilterEnabled(
        filterId,
        config,
        enableKey,
        normalizedValue > 0.5
      )
      return
    }

    const param = config[channel - 1]
    if (!param) {
      console.log('[MIDI CC] No canvas filter parameter for slider', {
        filterId,
        slider: channel + 1,
        parameterCount: config.length
      })
      return
    }

    let value
    if (param.type === 'checkbox') {
      value = normalizedValue > 0.5
    } else if (param.tableValues) {
      value = valueToTableValues(normalizedValue)
    } else {
      value = param.min + normalizedValue * (param.max - param.min)
      if (param.step >= 1) value = Math.round(value / param.step) * param.step
    }

    this.mainApp?.updateCanvasSetting?.({ setting: param.key, value })
    if (channel === 1 && typeof value === 'number' && value > 0) {
      this.canvasFilterLevels.set(filterId, value)
    }

    const display =
      typeof value === 'number' ? Number(value.toFixed(3)) : value
    this.showControlMessage(
      `${this.getCanvasFilterLabel(filterId)} · ${param.label}: ${display} · slider ${channel + 1}`
    )
    console.log('[MIDI CC] Canvas filter parameter', {
      filterId,
      slider: channel + 1,
      parameter: param.key,
      value
    })
  }

  applyCanvasFilterEnabled (filterId, config, enableKey, enabled) {
    if (enableKey) {
      this.mainApp?.updateCanvasSetting?.({
        setting: enableKey,
        value: enabled
      })
    } else {
      const levelParam = config[0]
      if (!levelParam) return

      const current = SETTINGS.CANVAS[levelParam.key]
      if (!enabled && typeof current === 'number' && current > 0) {
        this.canvasFilterLevels.set(filterId, current)
      }
      const restored =
        this.canvasFilterLevels.get(filterId) ??
        (typeof current === 'number' && current > 0
          ? current
          : levelParam.default ?? levelParam.max)
      this.mainApp?.updateCanvasSetting?.({
        setting: levelParam.key,
        value: enabled ? restored : 0
      })
    }

    this.showControlMessage(
      `${this.getCanvasFilterLabel(filterId)}: ${
        enabled ? 'enabled' : 'disabled'
      } · slider 1`
    )
    console.log('[MIDI CC] Canvas filter enabled', {
      filterId,
      enabled
    })
  }

  applyCanvasFilterLevel (normalizedValue, source = '') {
    const config = this.mapping.canvasFilterCycle
    const settings = Array.isArray(config?.settings) ? config.settings : []
    if (settings.length === 0) return
    const setting = settings[this.canvasFilterIndex]
    const meta = resolveCanvasMeta(setting)
    if (!meta || meta.type === 'boolean') return

    const mappedValue =
      meta.type === 'tableValues'
        ? valueToTableValues(normalizedValue)
        : (meta.min ?? 0) +
          normalizedValue * ((meta.max ?? 1) - (meta.min ?? 0))

    if (this.mainApp?.updateCanvasSetting) {
      this.mainApp.updateCanvasSetting({ setting, value: mappedValue })
      const display =
        typeof mappedValue === 'number'
          ? Number(mappedValue.toFixed(2))
          : mappedValue
      this.showControlMessage(
        `${this.getCanvasSettingLabel(setting)}: ${display}${
          source ? ` · ${source}` : ''
        }`
      )
      console.log('[MIDI CC] Canvas filter level', {
        source,
        setting,
        label: this.getCanvasSettingLabel(setting),
        value: mappedValue
      })
    }
  }

  getCanvasSettingLabel (setting) {
    return (
      CANVAS_SETTING_LABELS[setting] ||
      setting
        .toLowerCase()
        .split('_')
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ')
    )
  }

  getCanvasFilterLabel (filterId) {
    return filterId
      .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
      .replace(/^./, (letter) => letter.toUpperCase())
  }

  showControlMessage (message, showStatus = false) {
    if (this.mainApp?.showDebugMessage) {
      this.mainApp.showDebugMessage(message)
    }
    if (showStatus && this.mainApp?.uiManager?.showStatus) {
      this.mainApp.uiManager.showStatus(message, 'info')
    }
  }

  /**
   * Get current state for debugging
   * @returns {Object}
   */
  getState () {
    return {
      enabled: this.enabled,
      deviceId: this.deviceId,
      deviceName: this.deviceName,
      currentTrackId: this.currentTrackId,
      currentLuminode: this.currentLuminode,
      controlMode: this.controlMode,
      selectedCanvasFilter: this.getSelectedCanvasFilterId(),
      hasMapping: !!this.mapping,
      sourceLabel: this.sourceLabel,
      presetId: this.presetId,
      description: this.mapping?.description || null
    }
  }
}
