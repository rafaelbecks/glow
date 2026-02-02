// Modulation controls UI management
import { Pane } from '../lib/tweakpane.min.js'
import * as EssentialsPlugin from '../lib/tweakpane-plugin-essentials.min.js'
import { getLuminodeConfig } from '../luminode-configs.js'

export class ModulationUIManager {
  constructor (trackManager, panel) {
    this.trackManager = trackManager
    this.panel = panel
    this.modulatorPanes = new Map()
    this.mainPane = null
  }

  renderModulationControls () {
    const modulationContainer = this.panel.querySelector('#modulationControlsContainer')
    if (!modulationContainer) return

    if (this.mainPane) {
      this.mainPane.dispose()
      this.mainPane = null
    }
    this.modulatorPanes.clear()

    const modulators = this.trackManager.getModulators()
    const tracks = this.trackManager.getTracks()

    modulationContainer.innerHTML = `
      <div class="modulation-controls">
        <div class="control-section">
          <div class="modulator-header">
            <h4>Modulators</h4>
            <button class="add-modulator-btn" id="addModulatorBtn" ${modulators.length >= 4 ? 'disabled' : ''}>
              <ion-icon name="add-outline"></ion-icon>
              Add Modulator
            </button>
          </div>
          
          ${modulators.length === 0
            ? '<div class="no-modulators">No modulators. Click "Add Modulator" to create one.</div>'
            : ''
          }
          
          <div id="modulator-pane-container"></div>
        </div>
      </div>
    `

    this.setupAddModulatorListener()

    if (modulators.length > 0) {
      const paneContainer = modulationContainer.querySelector('#modulator-pane-container')
      if (paneContainer) {
        this.mainPane = new Pane({ container: paneContainer })
        this.mainPane.registerPlugin(EssentialsPlugin)

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

        modulators.forEach(modulator => {
          this.createModulatorPane(modulator, tracks)
        })
      }
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

      const modulatorData = {
        enabled: modulator.enabled,
        type: modulatorType,
        shape: modulator.shape || 'sine',
        targetTrack: modulator.targetTrack,
        targetConfigKey: modulator.targetConfigKey || '',
        rate: modulator.rate || 0.5,
        depth: modulator.depth || 0.5,
        offset: modulator.offset || 0,
        cubicBezier: modulator.cubicBezier || [0.5, 0, 0.5, 1],
        multiplier: modulator.multiplier !== undefined ? modulator.multiplier : 1.0,
        easing: modulator.easing || 'linear',
        threshold: modulator.threshold !== undefined ? modulator.threshold : 0.5
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

      const typeBinding = modulatorFolder.addBinding(modulatorData, 'type', {
        options: typeOptions,
        label: 'Type'
      }).on('change', (ev) => {
        modulatorData.type = ev.value
        this.trackManager.updateModulator(modulator.id, { type: ev.value })
        this.renderModulationControls()
      })

      let shapeBinding = null
      let waveformPreviewContainer = null
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
          this.updateWaveformPreview(modulatorFolder, ev.value)
          this.updateCubicBezierVisibility(modulatorFolder, ev.value === 'cubicBezier')
        })

        waveformPreviewContainer = document.createElement('div')
        waveformPreviewContainer.className = 'waveform-preview-container'
        if (modulator.shape === 'cubicBezier') {
          const bezier = modulator.cubicBezier && Array.isArray(modulator.cubicBezier) && modulator.cubicBezier.length === 4
            ? modulator.cubicBezier
            : [0.5, 0, 0.5, 1]
          waveformPreviewContainer.innerHTML = this.createCubicBezierPreview(bezier, 40, 20)
        } else {
          waveformPreviewContainer.innerHTML = this.createWaveformPreview(modulator.shape || 'sine', 40, 20)
        }
        
        setTimeout(() => {
          const shapeBindingElement = shapeBinding.controller?.view?.element || shapeBinding.element
          if (shapeBindingElement) {
            const labelRow = shapeBindingElement.closest('.tp-lblv') || shapeBindingElement.parentElement
            if (labelRow) {
              const previewRow = document.createElement('div')
              previewRow.className = 'waveform-preview-row'
              previewRow.appendChild(waveformPreviewContainer)
              labelRow.parentElement.insertBefore(previewRow, labelRow.nextSibling)
            }
          }
        }, 100)
      }

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
          .forEach(p => {
            configOptions[p.label] = p.key
          })

        const paramBinding = modulatorFolder.addBinding(modulatorData, 'targetConfigKey', {
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
          const currentParam = configParams.find(p => p.key === modulator.targetConfigKey)
          if (currentParam) {
            this.updateThresholdVisibility(modulatorFolder, modulator.targetConfigKey, configParams)
          }
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

      if (modulatorType === 'numberOfNotes' || modulatorType === 'velocity') {
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
          const paneData = this.modulatorPanes.get(modulator.id)
          if (paneData && paneData.waveformPreviewContainer) {
            paneData.waveformPreviewContainer.innerHTML = this.createCubicBezierPreview(bezierValue, 40, 20)
          }
        })
      }

      let thresholdBinding = null
      if (trackLuminode && modulator.targetConfigKey) {
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
        waveformPreviewContainer,
        cubicBezierBinding,
        thresholdBinding
      })
    } catch (error) {
      console.error(`Failed to create modulator pane for ${modulator.id}:`, error)
    }
  }

  updateWaveformPreview (folder, shape) {
    const paneData = Array.from(this.modulatorPanes.values()).find(p => p.folder === folder)
    if (paneData && paneData.waveformPreviewContainer) {
      if (shape === 'cubicBezier') {
        const bezier = paneData.modulatorData.cubicBezier && Array.isArray(paneData.modulatorData.cubicBezier) && paneData.modulatorData.cubicBezier.length === 4
          ? paneData.modulatorData.cubicBezier
          : [0.5, 0, 0.5, 1]
        paneData.waveformPreviewContainer.innerHTML = this.createCubicBezierPreview(bezier, 40, 20)
      } else {
        paneData.waveformPreviewContainer.innerHTML = this.createWaveformPreview(shape, 40, 20)
      }
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
        if (paneData.waveformPreviewContainer) {
          paneData.waveformPreviewContainer.innerHTML = this.createCubicBezierPreview(bezierValue, 40, 20)
        }
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

  createWaveformPreview (shape, width, height) {
    const viewBox = `0 0 ${width} ${height}`
    const centerY = height / 2
    let pathData = ''

    switch (shape) {
      case 'sine':
        pathData = `M 0,${centerY} ` + Array.from({ length: width }, (_, i) => {
          const x = i
          const y = centerY + Math.sin((i / width) * Math.PI * 4) * (height / 3)
          return `L ${x},${y}`
        }).join(' ')
        break
      case 'square':
        pathData = `M 0,${height * 0.25} L ${width / 4},${height * 0.25} L ${width / 4},${height * 0.75} L ${width * 3 / 4},${height * 0.75} L ${width * 3 / 4},${height * 0.25} L ${width},${height * 0.25}`
        break
      case 'triangle':
        pathData = `M 0,${height * 0.75} L ${width / 2},${height * 0.25} L ${width},${height * 0.75}`
        break
      case 'saw':
        pathData = `M 0,${height * 0.75} L ${width / 2},${height * 0.25} L ${width},${height * 0.75}`
        break
      default:
        pathData = `M 0,${centerY} L ${width},${centerY}`
    }

    return `
      <svg width="${width}" height="${height}" viewBox="${viewBox}" class="waveform-svg">
        <path d="${pathData}" stroke="currentColor" stroke-width="1.5" fill="none"/>
      </svg>
    `
  }

  createCubicBezierPreview (bezierPoints, width, height) {
    if (!bezierPoints || !Array.isArray(bezierPoints) || bezierPoints.length !== 4) {
      bezierPoints = [0.5, 0, 0.5, 1]
    }
    const [x1, y1, x2, y2] = bezierPoints
    const viewBox = `0 0 ${width} ${height}`
    const centerY = height / 2
    const scaleX = width
    const scaleY = height / 2

    const points = []
    for (let i = 0; i <= width; i++) {
      const t = i / width
      const y = this.cubicBezierEval(t, y1, y2)
      const x = i
      const mappedY = centerY - (y * scaleY)
      points.push(`${x},${mappedY}`)
    }

    const pathData = `M ${points[0]} L ${points.slice(1).map(p => p).join(' L ')}`

    return `
      <svg width="${width}" height="${height}" viewBox="${viewBox}" class="waveform-svg">
        <path d="${pathData}" stroke="currentColor" stroke-width="1.5" fill="none"/>
      </svg>
    `
  }

  cubicBezierEval (t, y1, y2) {
    const t2 = t * t
    const t3 = t2 * t
    const mt = 1 - t
    const mt2 = mt * mt
    const mt3 = mt2 * mt
    return mt3 * 0 + 3 * mt2 * t * y1 + 3 * mt * t2 * y2 + t3 * 1
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
