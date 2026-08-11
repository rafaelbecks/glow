// Modulation controls UI management
import { Pane } from '../lib/tweakpane.min.js'
import * as EssentialsPlugin from '../lib/tweakpane-plugin-essentials.min.js'
import * as WaveformPlugin from '../lib/tweakpane-plugin-waveform.min.js'
import { getLuminodeConfig } from '../luminode-configs.js'
import { getCanvasFilterConfig, getCanvasFilterIds } from '../canvas-filter-configs.js'
import {
  getShaderOverlayConfig,
  getShaderOverlayIds
} from '../shader-overlay-configs.js'
import { createAudioPlayerControl } from './audio-player-control.js'

const CANVAS_FILTER_LABELS = {
  clearAlpha: 'Clear Alpha',
  lumiaEffect: 'Lumia Effect',
  invertFilter: 'Invert',
  grayscaleFilter: 'Grayscale',
  hueRotateFilter: 'Hue Rotate',
  brightnessFilter: 'Brightness',
  contrastFilter: 'Contrast',
  saturationFilter: 'Saturation',
  dither: 'Dither'
}

const SHADER_OVERLAY_LABELS = {
  rain: 'Rain screen'
}

export class ModulationUIManager {
  constructor (trackManager, panel) {
    this.trackManager = trackManager
    this.panel = panel
    this.modulatorPanes = new Map()
    this.mainPane = null
    this.monitorAnimationFrame = null
    this.monitorSampleCount = 64
    this._audioDeviceRefreshAttempted = false
  }

  renderModulationControls () {
    const modulationContainer = this.panel.querySelector('#modulationControlsContainer')
    if (!modulationContainer) return

    if (this.mainPane) {
      this.mainPane.dispose()
      this.mainPane = null
    }
    this.stopMonitorLoop()
    this.modulatorPanes.clear()

    const modulators = this.trackManager.getModulators()
    const tracks = this.trackManager.getTracks()
    const modulationSystem = this.trackManager.getModulationSystem()
    const audioTracks = modulationSystem.getAudioTracks()

    modulationContainer.innerHTML = `
      <div class="modulation-controls">
        <div class="control-section">
          <div class="modulator-header">
            <h4>Audio Tracks</h4>
            <button class="add-modulator-btn" id="addAudioTrackBtn">
              <ion-icon name="add-outline"></ion-icon>
              Add Track
            </button>
          </div>
          ${audioTracks.length === 0
            ? '<div class="no-modulators">No shared audio tracks. Add one, then point any audio modulator at it.</div>'
            : ''
          }
        </div>

        <div class="control-section">
          <div class="modulator-header">
            <h4>Modulators</h4>
            <button class="add-modulator-btn" id="addModulatorBtn">
              <ion-icon name="add-outline"></ion-icon>
              Add Modulator
            </button>
          </div>
          ${modulators.length === 0
            ? '<div class="no-modulators">No modulators. Click "Add Modulator" to create one.</div>'
            : ''
          }
        </div>

        <div id="modulation-pane-container"></div>
      </div>
    `

    this.setupAddModulatorListener()
    this.setupAddAudioTrackListener()

    if (audioTracks.length === 0 && modulators.length === 0) return

    const paneContainer = modulationContainer.querySelector('#modulation-pane-container')
    if (!paneContainer) return

    this.mainPane = new Pane({ container: paneContainer })
    this.mainPane.registerPlugin(EssentialsPlugin)
    this.mainPane.registerPlugin(WaveformPlugin)

    const stylePane = () => {
      const paneElement = paneContainer.querySelector('.tp-rotv')
      if (paneElement) {
        paneElement.style.width = '100%'
        paneElement.style.margin = '0'
        paneElement.style.padding = '0'
        paneElement.style.background = 'transparent'
        paneElement.style.border = 'none'
      } else {
        requestAnimationFrame(stylePane)
      }
    }
    requestAnimationFrame(stylePane)

    audioTracks.forEach((track, index) => {
      this.createAudioTrackPane(this.mainPane, track, index)
    })

    modulators.forEach(modulator => {
      this.createModulatorPane(modulator, tracks)
    })

    if (modulators.length > 0) {
      this.startMonitorLoop()
    }
  }

  createModulatorPane (modulator, tracks) {
    try {
      const modulationSystem = this.trackManager.getModulationSystem()
      const waveformShapes = modulationSystem.getWaveformShapes()
      const waveformNames = modulationSystem.getWaveformShapeNames()
      const modulatorTypes = modulationSystem.getModulatorTypes()
      const modulatorTypeNames = modulationSystem.getModulatorTypeNames()
      const easingFunctions = modulationSystem.getEasingFunctions()
      const easingFunctionNames = modulationSystem.getEasingFunctionNames()

      const track = tracks.find(t => t.id === modulator.targetTrack)
      const trackLuminode = track ? track.luminode : null
      const modulatorType = modulator.type || 'lfo'

      const targetDestination = modulator.targetDestination || 'track'
      const modulatorData = {
        enabled: modulator.enabled,
        type: modulatorType,
        shape: modulator.shape || 'sine',
        targetDestination,
        targetTrack: modulator.targetTrack,
        targetCanvasFilter: modulator.targetCanvasFilter || '',
        targetShaderOverlay: modulator.targetShaderOverlay || '',
        targetConfigKey: modulator.targetConfigKey || '',
        rate: modulator.rate || 0.5,
        depth: modulator.depth || 0.5,
        offset: modulator.offset || 0,
        cubicBezier: modulator.cubicBezier || [0.5, 0, 0.5, 1],
        multiplier: modulator.multiplier !== undefined ? modulator.multiplier : 1.0,
        easing: modulator.easing || 'linear',
        threshold: modulator.threshold !== undefined ? modulator.threshold : 0.5,
        audioDeviceId: modulator.audioDeviceId || '',
        audioChannel: modulator.audioChannel !== undefined ? modulator.audioChannel : 0,
        audioFeature: modulator.audioFeature || 'rms',
        audioFreqMin: modulator.audioFreqMin !== undefined ? modulator.audioFreqMin : 20,
        audioFreqMax: modulator.audioFreqMax !== undefined ? modulator.audioFreqMax : 20000,
        audioSmoothing: modulator.audioSmoothing !== undefined ? modulator.audioSmoothing : 0.7,
        audioSourceType: modulator.audioSourceType || 'input',
        audioTrackId: modulator.audioTrackId || ''
      }

      const modulatorFolder = this.mainPane.addFolder({
        title: `Modulator ${this.modulatorPanes.size + 1}`,
        expanded: true
      })

      modulatorFolder.addBinding(modulatorData, 'enabled', {
        label: 'Enabled'
      }).on('change', (ev) => {
        modulatorData.enabled = ev.value
        this.trackManager.updateModulator(modulator.id, { enabled: ev.value })
      })

      const typeOptions = {}
      modulatorTypes.forEach(type => {
        typeOptions[modulatorTypeNames[type]] = type
      })

      modulatorFolder.addBinding(modulatorData, 'type', {
        options: typeOptions,
        label: 'Type'
      }).on('change', (ev) => {
        modulatorData.type = ev.value
        this.trackManager.updateModulator(modulator.id, { type: ev.value })
        this.renderModulationControls()
      })

      const destOptions = {
        Track: 'track',
        'Canvas Filter': 'canvasFilter',
        'Shader Overlay': 'shaderOverlay'
      }
      modulatorFolder.addBinding(modulatorData, 'targetDestination', {
        options: destOptions,
        label: 'Destination'
      }).on('change', (ev) => {
        modulatorData.targetDestination = ev.value
        this.trackManager.updateModulator(modulator.id, {
          targetDestination: ev.value,
          targetConfigKey: null,
          targetCanvasFilter: null,
          targetShaderOverlay: null
        })
        this.renderModulationControls()
      })

      let shapeBinding = null
      if (modulatorType === 'lfo') {
        const waveformOptions = {}
        waveformShapes.forEach(shape => {
          waveformOptions[waveformNames[shape]] = shape
        })
        waveformOptions['Cubic Bezier'] = 'cubicBezier'

        shapeBinding = modulatorFolder.addBinding(modulatorData, 'shape', {
          options: waveformOptions,
          label: 'Waveform'
        }).on('change', (ev) => {
          modulatorData.shape = ev.value
          this.trackManager.updateModulator(modulator.id, { shape: ev.value })
          this.updateCubicBezierVisibility(modulatorFolder, ev.value === 'cubicBezier')
        })
      }

      if (targetDestination === 'track') {
        const trackOptions = {}
        tracks.forEach(t => {
          const label = t.luminode ? `Track ${t.id} (${t.luminode})` : `Track ${t.id}`
          trackOptions[label] = t.id
        })
        modulatorFolder.addBinding(modulatorData, 'targetTrack', {
          options: trackOptions,
          label: 'Track'
        }).on('change', (ev) => {
          const targetTrack = ev.value
          modulatorData.targetTrack = targetTrack
          const newTrack = tracks.find(t => t.id === targetTrack)
          const targetLuminode = newTrack && newTrack.luminode ? newTrack.luminode : null
          this.trackManager.updateModulator(modulator.id, {
            targetTrack,
            targetLuminode,
            targetConfigKey: null
          })
          this.renderModulationControls()
        })

        if (trackLuminode) {
          const configParams = getLuminodeConfig(trackLuminode)
          const configOptions = { 'Select Parameter': '' }
          configParams
            .filter(p => p.type === 'slider' || p.type === 'number' || p.type === 'checkbox')
            .forEach(p => { configOptions[p.label] = p.key })

          modulatorFolder.addBinding(modulatorData, 'targetConfigKey', {
            options: configOptions,
            label: 'Parameter'
          }).on('change', (ev) => {
            modulatorData.targetConfigKey = ev.value || ''
            this.trackManager.updateModulator(modulator.id, {
              targetConfigKey: ev.value || null,
              targetLuminode: trackLuminode
            })
            this.updateThresholdVisibility(modulatorFolder, ev.value, configParams)
          })
          if (modulator.targetConfigKey) {
            this.updateThresholdVisibility(modulatorFolder, modulator.targetConfigKey, configParams)
          }
        }
      } else if (targetDestination === 'shaderOverlay') {
        const overlayOptions = { 'Select Overlay': '' }
        getShaderOverlayIds().forEach((id) => {
          overlayOptions[SHADER_OVERLAY_LABELS[id] || id] = id
        })
        modulatorFolder
          .addBinding(modulatorData, 'targetShaderOverlay', {
            options: overlayOptions,
            label: 'Shader Overlay'
          })
          .on('change', (ev) => {
            modulatorData.targetShaderOverlay = ev.value || ''
            this.trackManager.updateModulator(modulator.id, {
              targetShaderOverlay: ev.value || null,
              targetConfigKey: null
            })
            this.renderModulationControls()
          })

        const shaderOverlayId =
          modulator.targetShaderOverlay || modulatorData.targetShaderOverlay
        if (shaderOverlayId) {
          const configParams = getShaderOverlayConfig(shaderOverlayId)
          const configOptions = { 'Select Parameter': '' }
          configParams.forEach((p) => {
            configOptions[p.label] = p.key
          })
          modulatorFolder
            .addBinding(modulatorData, 'targetConfigKey', {
              options: configOptions,
              label: 'Parameter'
            })
            .on('change', (ev) => {
              modulatorData.targetConfigKey = ev.value || ''
              this.trackManager.updateModulator(modulator.id, {
                targetConfigKey: ev.value || null,
                targetShaderOverlay: shaderOverlayId
              })
            })
        }
      } else if (targetDestination === 'canvasFilter') {
        const filterOptions = { 'Select Filter': '' }
        getCanvasFilterIds().forEach(id => {
          filterOptions[CANVAS_FILTER_LABELS[id] || id] = id
        })
        modulatorFolder.addBinding(modulatorData, 'targetCanvasFilter', {
          options: filterOptions,
          label: 'Canvas Filter'
        }).on('change', (ev) => {
          modulatorData.targetCanvasFilter = ev.value || ''
          this.trackManager.updateModulator(modulator.id, {
            targetCanvasFilter: ev.value || null,
            targetConfigKey: null
          })
          this.renderModulationControls()
        })

        const canvasFilterId = modulator.targetCanvasFilter || modulatorData.targetCanvasFilter
        if (canvasFilterId) {
          const configParams = getCanvasFilterConfig(canvasFilterId)
          const configOptions = { 'Select Parameter': '' }
          configParams.forEach(p => { configOptions[p.label] = p.key })
          modulatorFolder.addBinding(modulatorData, 'targetConfigKey', {
            options: configOptions,
            label: 'Parameter'
          }).on('change', (ev) => {
            modulatorData.targetConfigKey = ev.value || ''
            this.trackManager.updateModulator(modulator.id, {
              targetConfigKey: ev.value || null,
              targetCanvasFilter: canvasFilterId
            })
          })
        }
      }

      if (modulatorType === 'lfo') {
        modulatorFolder.addBinding(modulatorData, 'rate', {
          label: 'Rate',
          min: 0.001,
          max: 1,
          step: 0.001
        }).on('change', (ev) => {
          modulatorData.rate = ev.value
          this.trackManager.updateModulator(modulator.id, { rate: ev.value })
        })

        modulatorFolder.addBinding(modulatorData, 'depth', {
          label: 'Depth',
          min: 0,
          max: 1,
          step: 0.01
        }).on('change', (ev) => {
          modulatorData.depth = ev.value
          this.trackManager.updateModulator(modulator.id, { depth: ev.value })
        })

        modulatorFolder.addBinding(modulatorData, 'offset', {
          label: 'Offset',
          min: -1,
          max: 1,
          step: 0.01
        }).on('change', (ev) => {
          modulatorData.offset = ev.value
          this.trackManager.updateModulator(modulator.id, { offset: ev.value })
        })
      }

      if (modulatorType === 'audio') {
        this.addAudioModulatorControls(
          modulatorFolder,
          modulator,
          modulatorData,
          modulationSystem
        )
      }

      const waveformMonitorData = {
        values: this.createMonitorSamples(modulator, this.monitorSampleCount)
      }
      modulatorFolder.addBinding(waveformMonitorData, 'values', {
        view: 'waveform',
        label: 'Monitor',
        min: -1,
        max: 1,
        interval: 50,
        style: 'bezier'
      })

      if (
        modulatorType === 'numberOfNotes' ||
        modulatorType === 'velocity' ||
        modulatorType === 'audio'
      ) {
        modulatorFolder.addBinding(modulatorData, 'multiplier', {
          label: 'Multiplier',
          min: 0.1,
          max: 10,
          step: 0.1
        }).on('change', (ev) => {
          modulatorData.multiplier = ev.value
          this.trackManager.updateModulator(modulator.id, { multiplier: ev.value })
        })

        const easingOptions = {}
        easingFunctions.forEach(easing => {
          easingOptions[easingFunctionNames[easing]] = easing
        })

        modulatorFolder.addBinding(modulatorData, 'easing', {
          options: easingOptions,
          label: 'Easing'
        }).on('change', (ev) => {
          modulatorData.easing = ev.value
          this.trackManager.updateModulator(modulator.id, { easing: ev.value })
        })
      }

      let cubicBezierBinding = null
      if (modulatorType === 'lfo' && modulator.shape === 'cubicBezier') {
        const bezierValue = modulator.cubicBezier && Array.isArray(modulator.cubicBezier) && modulator.cubicBezier.length === 4
          ? modulator.cubicBezier
          : [0.5, 0, 0.5, 1]
        modulatorData.cubicBezier = bezierValue
        cubicBezierBinding = modulatorFolder.addBlade({
          view: 'cubicbezier',
          value: bezierValue,
          expanded: true,
          label: 'Cubic Bezier',
          picker: 'inline'
        }).on('change', (ev) => {
          const bezierValue = Array.isArray(ev.value) && ev.value.length === 4 ? ev.value : [0.5, 0, 0.5, 1]
          modulatorData.cubicBezier = bezierValue
          this.trackManager.updateModulator(modulator.id, { cubicBezier: bezierValue })
        })
      }

      let thresholdBinding = null
      if (targetDestination === 'track' && trackLuminode && modulator.targetConfigKey) {
        const configParams = getLuminodeConfig(trackLuminode)
        const currentParam = configParams.find(p => p.key === modulator.targetConfigKey)
        if (currentParam && currentParam.type === 'checkbox') {
          thresholdBinding = modulatorFolder.addBinding(modulatorData, 'threshold', {
            label: 'Threshold',
            min: 0,
            max: 1,
            step: 0.01
          }).on('change', (ev) => {
            modulatorData.threshold = ev.value
            this.trackManager.updateModulator(modulator.id, { threshold: ev.value })
          })
        }
      }

      modulatorFolder.addBlade({
        view: 'button',
        label: 'Delete',
        title: 'Remove Modulator'
      }).on('click', () => {
        this.trackManager.removeModulator(modulator.id)
        this.renderModulationControls()
      })

      this.modulatorPanes.set(modulator.id, {
        folder: modulatorFolder,
        modulatorData,
        waveformMonitorData,
        cubicBezierBinding,
        thresholdBinding
      })
    } catch (error) {
      console.error(`Failed to create modulator pane for ${modulator.id}:`, error)
    }
  }

  updateCubicBezierVisibility (folder, show) {
    const paneData = Array.from(this.modulatorPanes.values()).find(p => p.folder === folder)
    if (!paneData) return

    const modulatorId = Array.from(this.modulatorPanes.entries()).find(([id, data]) => data.folder === folder)?.[0]
    if (!modulatorId) return

    const modulator = this.trackManager.getModulators().find(m => m.id === modulatorId)
    if (!modulator) return

    if (show && !paneData.cubicBezierBinding) {
      const bezierValue = modulator.cubicBezier && Array.isArray(modulator.cubicBezier) && modulator.cubicBezier.length === 4
        ? modulator.cubicBezier
        : [0.5, 0, 0.5, 1]
      paneData.cubicBezierBinding = folder.addBlade({
        view: 'cubicbezier',
        value: bezierValue,
        expanded: true,
        label: 'Cubic Bezier',
        picker: 'inline'
      }).on('change', (ev) => {
        const bezierValue = Array.isArray(ev.value) && ev.value.length === 4 ? ev.value : [0.5, 0, 0.5, 1]
        paneData.modulatorData.cubicBezier = bezierValue
        this.trackManager.updateModulator(modulatorId, { cubicBezier: bezierValue })
      })
    } else if (!show && paneData.cubicBezierBinding) {
      try {
        paneData.cubicBezierBinding.dispose()
      } catch (e) {
        console.warn('Error disposing cubic bezier binding:', e)
      }
      paneData.cubicBezierBinding = null
    }
  }

  startMonitorLoop () {
    this.stopMonitorLoop()
    const update = () => {
      const modulationSystem = this.trackManager.getModulationSystem()
      this.modulatorPanes.forEach((paneData, modulatorId) => {
        const modulator = modulationSystem.getModulator(modulatorId)
        if (!modulator || !paneData.waveformMonitorData) return
        paneData.waveformMonitorData.values = this.createMonitorSamples(modulator, this.monitorSampleCount)
      })
      this.monitorAnimationFrame = requestAnimationFrame(update)
    }
    this.monitorAnimationFrame = requestAnimationFrame(update)
  }

  stopMonitorLoop () {
    if (this.monitorAnimationFrame) {
      cancelAnimationFrame(this.monitorAnimationFrame)
      this.monitorAnimationFrame = null
    }
  }

  setMonitorActive (active) {
    if (active) {
      if (this.modulatorPanes.size > 0) {
        this.startMonitorLoop()
      }
      return
    }
    this.stopMonitorLoop()
  }

  createMonitorSamples (modulator, sampleCount = 64) {
    const modulationSystem = this.trackManager.getModulationSystem()
    const values = new Array(sampleCount).fill(0)
    if (!modulator || !modulator.enabled) {
      return values
    }

    if (modulator.type === 'lfo') {
      const now = modulationSystem.getCurrentTime()
      const windowSeconds = 2
      const rate = Math.max(0.001, modulator.rate || 0.1)
      const depth = modulator.depth || 0
      const offset = modulator.offset || 0
      const sampleStep = windowSeconds / Math.max(1, sampleCount - 1)

      for (let i = 0; i < sampleCount; i++) {
        const sampleTime = now - (windowSeconds - i * sampleStep)
        const phase = sampleTime * rate * Math.PI * 2
        const waveform = modulationSystem.generateWaveform(
          modulator.shape || 'sine',
          phase,
          modulator.cubicBezier
        )
        values[i] = Math.max(-1, Math.min(1, waveform * depth + offset))
      }
      return values
    }

    if (modulator.type === 'audio') {
      return modulationSystem
        .getAudioEngine()
        .getMonitorSamples(modulator, sampleCount)
    }

    return values
  }

  addAudioModulatorControls (modulatorFolder, modulator, modulatorData, modulationSystem) {
    const audioEngine = modulationSystem.getAudioEngine()
    const sourceType = modulator.audioSourceType || 'input'

    modulatorFolder
      .addBinding(modulatorData, 'audioSourceType', {
        options: {
          'Live Input': 'input',
          'Audio Track': 'file'
        },
        label: 'Source'
      })
      .on('change', (ev) => {
        modulatorData.audioSourceType = ev.value
        this.trackManager.updateModulator(modulator.id, {
          audioSourceType: ev.value
        })
        this.renderModulationControls()
      })

    if (sourceType === 'file') {
      this.addAudioTrackPicker(
        modulatorFolder,
        modulator,
        modulatorData,
        modulationSystem
      )
    } else {
      this.addAudioInputControls(
        modulatorFolder,
        modulator,
        modulatorData,
        modulationSystem,
        audioEngine
      )
    }

    const channelCount =
      sourceType === 'file'
        ? audioEngine.getTrackChannelCount(modulator.audioTrackId)
        : modulator.audioDeviceId
          ? audioEngine.getChannelCount(modulator.audioDeviceId)
          : 1
    if (channelCount > 1) {
      const channelOptions = {}
      for (let i = 0; i < channelCount; i++) {
        channelOptions[`Channel ${i + 1}`] = i
      }
      modulatorFolder
        .addBinding(modulatorData, 'audioChannel', {
          options: channelOptions,
          label: 'Channel'
        })
        .on('change', (ev) => {
          modulatorData.audioChannel = ev.value
          this.trackManager.updateModulator(modulator.id, {
            audioChannel: ev.value
          })
        })
    }

    const featureNames = audioEngine.getAudioFeatureNames()
    const featureOptions = {}
    audioEngine.getAudioFeatures().forEach((feature) => {
      featureOptions[featureNames[feature]] = feature
    })
    modulatorFolder
      .addBinding(modulatorData, 'audioFeature', {
        options: featureOptions,
        label: 'Analysis'
      })
      .on('change', (ev) => {
        modulatorData.audioFeature = ev.value
        this.trackManager.updateModulator(modulator.id, {
          audioFeature: ev.value
        })
        this.renderModulationControls()
      })

    if (modulatorData.audioFeature === 'band') {
      modulatorFolder
        .addBinding(modulatorData, 'audioFreqMin', {
          label: 'Freq Min (Hz)',
          min: 20,
          max: 20000,
          step: 1
        })
        .on('change', (ev) => {
          modulatorData.audioFreqMin = ev.value
          this.trackManager.updateModulator(modulator.id, {
            audioFreqMin: ev.value
          })
        })

      modulatorFolder
        .addBinding(modulatorData, 'audioFreqMax', {
          label: 'Freq Max (Hz)',
          min: 20,
          max: 20000,
          step: 1
        })
        .on('change', (ev) => {
          modulatorData.audioFreqMax = ev.value
          this.trackManager.updateModulator(modulator.id, {
            audioFreqMax: ev.value
          })
        })
    }

    modulatorFolder
      .addBinding(modulatorData, 'audioSmoothing', {
        label: 'Smoothing',
        min: 0,
        max: 0.99,
        step: 0.01
      })
      .on('change', (ev) => {
        modulatorData.audioSmoothing = ev.value
        this.trackManager.updateModulator(modulator.id, {
          audioSmoothing: ev.value
        })
      })

    modulatorFolder
      .addBinding(modulatorData, 'depth', {
        label: 'Depth',
        min: 0,
        max: 1,
        step: 0.01
      })
      .on('change', (ev) => {
        modulatorData.depth = ev.value
        this.trackManager.updateModulator(modulator.id, { depth: ev.value })
      })

    modulatorFolder
      .addBinding(modulatorData, 'offset', {
        label: 'Offset',
        min: -1,
        max: 1,
        step: 0.01
      })
      .on('change', (ev) => {
        modulatorData.offset = ev.value
        this.trackManager.updateModulator(modulator.id, { offset: ev.value })
      })
  }

  addAudioTrackPicker (modulatorFolder, modulator, modulatorData, modulationSystem) {
    const audioTracks = modulationSystem.getAudioTracks()
    const trackOptions = { 'Select Track': '' }
    audioTracks.forEach((track, index) => {
      const label = track.name || `Audio Track ${index + 1}`
      trackOptions[label] = track.id
    })

    if (
      modulator.audioTrackId &&
      !Object.values(trackOptions).includes(modulator.audioTrackId)
    ) {
      trackOptions[`Missing (${modulator.audioTrackId.slice(0, 8)}…)`] =
        modulator.audioTrackId
    }

    modulatorFolder
      .addBinding(modulatorData, 'audioTrackId', {
        options: trackOptions,
        label: 'Track'
      })
      .on('change', (ev) => {
        const trackId = ev.value || null
        modulatorData.audioTrackId = trackId || ''
        this.trackManager.updateModulator(modulator.id, {
          audioTrackId: trackId,
          audioChannel: 0
        })
        this.renderModulationControls()
      })
  }

  addAudioInputControls (
    modulatorFolder,
    modulator,
    modulatorData,
    modulationSystem,
    audioEngine
  ) {
    const devices = audioEngine.getDevices()
    const deviceOptions = { 'Select Input': '' }
    devices.forEach((device) => {
      deviceOptions[device.label] = device.deviceId
    })
    if (
      modulator.audioDeviceId &&
      !deviceOptions[modulator.audioDeviceLabel] &&
      !Object.values(deviceOptions).includes(modulator.audioDeviceId)
    ) {
      const fallbackLabel =
        modulator.audioDeviceLabel ||
        `Saved Input (${modulator.audioDeviceId.slice(0, 6)}…)`
      deviceOptions[fallbackLabel] = modulator.audioDeviceId
    }

    modulatorFolder
      .addBinding(modulatorData, 'audioDeviceId', {
        options: deviceOptions,
        label: 'Audio Input'
      })
      .on('change', async (ev) => {
        const deviceId = ev.value || null
        modulatorData.audioDeviceId = deviceId || ''
        const device = audioEngine.findDevice(deviceId)
        const updates = {
          audioDeviceId: deviceId,
          audioDeviceLabel: device ? device.label : modulator.audioDeviceLabel
        }
        this.trackManager.updateModulator(modulator.id, updates)

        if (deviceId) {
          try {
            const input = await audioEngine.ensureInput(deviceId)
            const channelCount = input?.channelCount || 1
            if ((modulator.audioChannel || 0) >= channelCount) {
              this.trackManager.updateModulator(modulator.id, {
                audioChannel: 0
              })
            }
            this.renderModulationControls()
          } catch (error) {
            console.error('Failed to open audio input:', error)
          }
        } else {
          modulationSystem.syncAudioInputs()
        }
      })

    modulatorFolder
      .addBlade({
        view: 'button',
        label: 'Devices',
        title: 'Refresh Inputs'
      })
      .on('click', async () => {
        try {
          this._audioDeviceRefreshAttempted = true
          await audioEngine.refreshDevices()
          this.renderModulationControls()
        } catch (error) {
          console.error('Failed to refresh audio devices:', error)
        }
      })

    if (devices.length === 0 && !this._audioDeviceRefreshAttempted) {
      this._audioDeviceRefreshAttempted = true
      audioEngine
        .refreshDevices()
        .then(() => {
          if (audioEngine.getDevices().length > 0) {
            this.renderModulationControls()
          }
        })
        .catch((error) => {
          console.warn('Audio device enumeration failed:', error)
        })
    }
  }

  createAudioTrackPane (parent, track, index) {
    const modulationSystem = this.trackManager.getModulationSystem()
    const audioEngine = modulationSystem.getAudioEngine()
    const trackData = {
      enabled: track.enabled !== false,
      loop: track.loop !== false,
      name: track.name || `Audio Track ${index + 1}`
    }

    const folder = parent.addFolder({
      title: `Audio Track ${index + 1}`,
      expanded: true
    })

    let playerControl = null

    folder
      .addBinding(trackData, 'enabled', {
        label: 'Enabled'
      })
      .on('change', (ev) => {
        trackData.enabled = ev.value
        modulationSystem.updateAudioTrack(track.id, { enabled: ev.value })
        if (playerControl) playerControl.setDisabled(!ev.value)
      })

    folder
      .addBinding(trackData, 'loop', {
        label: 'Loop'
      })
      .on('change', (ev) => {
        trackData.loop = ev.value
        modulationSystem.updateAudioTrack(track.id, { loop: ev.value })
      })

    folder
      .addBinding(trackData, 'name', {
        label: 'Name'
      })
      .on('change', (ev) => {
        trackData.name = ev.value
        modulationSystem.updateAudioTrack(track.id, { name: ev.value })
      })

    const fileInput = document.createElement('input')
    fileInput.type = 'file'
    fileInput.accept = 'audio/*,.mp3,.wav,.ogg,.m4a,.flac,.aac'
    fileInput.hidden = true
    folder.element.appendChild(fileInput)

    folder
      .addBlade({
        view: 'button',
        label: 'File',
        title: track.dataUrl ? 'Replace Audio File' : 'Load Audio File'
      })
      .on('click', () => fileInput.click())

    fileInput.addEventListener('change', async () => {
      const file = fileInput.files && fileInput.files[0]
      if (!file) return
      try {
        await audioEngine.ensureAudioContext()
        await modulationSystem.loadAudioTrackFile(track.id, file, {
          name: file.name,
          loop: trackData.loop,
          enabled: trackData.enabled
        })
        this.renderModulationControls()
      } catch (error) {
        console.error('Failed to load audio track:', error)
      } finally {
        fileInput.value = ''
      }
    })

    const audioEl = audioEngine.getTrackAudioElement(track.id)
    if (audioEl && (track.dataUrl || audioEl.src)) {
      audioEngine.ensureTrackGraph(track.id).catch((error) => {
        console.warn('Failed to prepare audio track graph:', error)
      })
      try {
        playerControl = createAudioPlayerControl(audioEl, {
          disabled: !trackData.enabled
        })
        const playerRow = document.createElement('div')
        playerRow.className = 'tp-lblv glow-audio-player-row'
        playerRow.innerHTML = `
          <div class="tp-lblv_l">Player</div>
          <div class="tp-lblv_v"></div>
        `
        playerRow.querySelector('.tp-lblv_v').appendChild(playerControl.element)
        const folderBody =
          folder.element?.querySelector('.tp-fldv_c') || folder.element
        if (folderBody) folderBody.appendChild(playerRow)
      } catch (error) {
        console.warn('Failed to mount audio player:', error)
      }
    }

    folder
      .addBlade({
        view: 'button',
        label: 'Delete',
        title: 'Remove Track'
      })
      .on('click', () => {
        modulationSystem.removeAudioTrack(track.id)
        this.renderModulationControls()
      })
  }

  updateThresholdVisibility (folder, configKey, configParams) {
    const paneData = Array.from(this.modulatorPanes.values()).find(p => p.folder === folder)
    if (!paneData) return

    const modulatorId = Array.from(this.modulatorPanes.entries()).find(([id, data]) => data.folder === folder)?.[0]
    if (!modulatorId) return

    const currentParam = configParams.find(p => p.key === configKey)
    const isBoolean = currentParam && currentParam.type === 'checkbox'

    if (isBoolean && !paneData.thresholdBinding) {
      const modulator = this.trackManager.getModulators().find(m => m.id === modulatorId)
      if (modulator) {
        const threshold = modulator.threshold !== undefined ? modulator.threshold : 0.5
        paneData.modulatorData.threshold = threshold
        paneData.thresholdBinding = folder.addBinding(paneData.modulatorData, 'threshold', {
          label: 'Threshold',
          min: 0,
          max: 1,
          step: 0.01
        }).on('change', (ev) => {
          paneData.modulatorData.threshold = ev.value
          this.trackManager.updateModulator(modulatorId, { threshold: ev.value })
        })
      }
    } else if (!isBoolean && paneData.thresholdBinding) {
      try {
        paneData.thresholdBinding.dispose()
      } catch (e) {
        console.warn('Error disposing threshold binding:', e)
      }
      paneData.thresholdBinding = null
    }
  }

  setupAddAudioTrackListener () {
    const addBtn = this.panel.querySelector('#addAudioTrackBtn')
    if (!addBtn) return
    addBtn.addEventListener('click', () => {
      const modulationSystem = this.trackManager.getModulationSystem()
      const count = modulationSystem.getAudioTracks().length
      modulationSystem.createAudioTrack({
        name: `Audio Track ${count + 1}`,
        enabled: true,
        loop: true
      })
      this.renderModulationControls()
    })
  }

  setupAddModulatorListener () {
    const addBtn = this.panel.querySelector('#addModulatorBtn')
    if (addBtn) {
      addBtn.addEventListener('click', () => {
        const modulationSystem = this.trackManager.getModulationSystem()
        const modulatorId = modulationSystem.addModulator('lfo')
        if (modulatorId) {
          this.renderModulationControls()
        }
      })
    }

    const removeBtns = this.panel.querySelectorAll('.remove-modulator-btn')
    removeBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const modulatorId = e.currentTarget.dataset.modulatorId
        this.trackManager.removeModulator(modulatorId)
        this.renderModulationControls()
      })
    })
  }
}
