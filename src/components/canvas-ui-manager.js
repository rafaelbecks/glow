import { Pane } from '../lib/tweakpane.min.js'
import { UTILS } from '../settings.js'

export class CanvasUIManager {
  constructor (panel) {
    this.panel = panel
    this.settings = null
    this.mainPane = null
  }

  setSettings (settings) {
    this.settings = settings
  }

  renderCanvasControls () {
    const canvasControlsContainer = this.panel.querySelector('#canvasControlsContainer')
    if (!canvasControlsContainer) return

    if (this.mainPane) {
      this.mainPane.dispose()
      this.mainPane = null
    }

    canvasControlsContainer.innerHTML = '<div id="canvas-pane-container"></div>'

    const paneContainer = canvasControlsContainer.querySelector('#canvas-pane-container')
    if (!paneContainer) return

    this.mainPane = new Pane({ container: paneContainer })

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

    const settings = this.settings || {}
    const canvasSettings = settings.CANVAS || {}
    const colorSettings = settings.COLORS || {
      SOTO_PALETTE: ['#EF4136', '#005BBB', '#FCEE09', '#2E7D32', '#FFFFFF', '#4A148C', '#8B0000'],
      POLYGON_COLORS: ['#f93822', '#fcdc4d', '#00a6a6', '#90be6d', '#f94144', '#ff006e', '#8338ec']
    }

    const canvasData = {
      clearAlpha: canvasSettings.CLEAR_ALPHA || 0.4,
      backgroundColor: canvasSettings.BACKGROUND_COLOR || '#000000',
      crtMode: canvasSettings.CRT_MODE || false,
      crtIntensity: canvasSettings.CRT_INTENSITY || 100,
      lumiaEffect: canvasSettings.LUMIA_EFFECT || 0,
      gridEnabled: canvasSettings.GRID_ENABLED || false,
      gridXLines: canvasSettings.GRID_X_LINES || 10,
      gridYLines: canvasSettings.GRID_Y_LINES || 10,
      gridColor: canvasSettings.GRID_COLOR || '#333333',
      noiseOverlay: canvasSettings.NOISE_OVERLAY || false,
      noiseAnimate: canvasSettings.NOISE_ANIMATE || true,
      noisePatternWidth: canvasSettings.NOISE_PATTERN_WIDTH || 100,
      noisePatternHeight: canvasSettings.NOISE_PATTERN_HEIGHT || 100,
      noiseOpacity: canvasSettings.NOISE_OPACITY || 0.05,
      noiseDensity: canvasSettings.NOISE_DENSITY || 1,
      noiseWidth: canvasSettings.NOISE_WIDTH || 1,
      noiseHeight: canvasSettings.NOISE_HEIGHT || 1,
      ditherOverlay: canvasSettings.DITHER_OVERLAY || false,
      ditherSaturate: canvasSettings.DITHER_SATURATE || 1,
      ditherTableValuesR: this.parseTableValuesToSlider(canvasSettings.DITHER_TABLE_VALUES_R || '0 1'),
      ditherTableValuesG: this.parseTableValuesToSlider(canvasSettings.DITHER_TABLE_VALUES_G || '0 1'),
      ditherTableValuesB: this.parseTableValuesToSlider(canvasSettings.DITHER_TABLE_VALUES_B || '0 1'),
      chromaticAberrationEnabled: canvasSettings.CHROMATIC_ABERRATION_ENABLED || false,
      chromaticAberrationContrast: canvasSettings.CHROMATIC_ABERRATION_CONTRAST || 1,
      invertFilter: canvasSettings.INVERT_FILTER || 0
    }

    const pitchColorData = {
      hueFactor: UTILS.pitchColorFactor || 30
    }

    const canvasFolder = this.mainPane.addFolder({ title: 'Canvas Settings', expanded: true })

    canvasFolder.addBinding(canvasData, 'clearAlpha', {
      label: 'Clear Alpha',
      min: 0,
      max: 1,
      step: 0.01
    }).on('change', (ev) => {
      this.triggerCanvasSettingChange('CLEAR_ALPHA', ev.value)
    })

    canvasFolder.addBinding(canvasData, 'backgroundColor', {
      label: 'Background Color',
      picker: 'inline'
    }).on('change', (ev) => {
      this.triggerCanvasSettingChange('BACKGROUND_COLOR', ev.value)
    })

    canvasFolder.addBinding(canvasData, 'crtMode', {
      label: 'CRT Mode'
    }).on('change', (ev) => {
      this.triggerCanvasSettingChange('CRT_MODE', ev.value)
      this.updateFolderVisibility(crtIntensityFolder, ev.value)
    })

    const crtIntensityFolder = canvasFolder.addFolder({ title: 'CRT Intensity', expanded: true })
    crtIntensityFolder.addBinding(canvasData, 'crtIntensity', {
      label: 'Intensity',
      min: 80,
      max: 200,
      step: 5
    }).on('change', (ev) => {
      this.triggerCanvasSettingChange('CRT_INTENSITY', ev.value)
    })
    this.updateFolderVisibility(crtIntensityFolder, canvasData.crtMode)

    canvasFolder.addBinding(canvasData, 'lumiaEffect', {
      label: 'Lumia Effect',
      min: 0,
      max: 100,
      step: 5
    }).on('change', (ev) => {
      this.triggerCanvasSettingChange('LUMIA_EFFECT', ev.value)
    })

    canvasFolder.addBinding(canvasData, 'gridEnabled', {
      label: 'Background Grid'
    }).on('change', (ev) => {
      this.triggerCanvasSettingChange('GRID_ENABLED', ev.value)
      this.updateFolderVisibility(gridFolder, ev.value)
    })

    const gridFolder = canvasFolder.addFolder({ title: 'Grid Settings', expanded: true })
    gridFolder.addBinding(canvasData, 'gridXLines', {
      label: 'X Lines',
      min: 2,
      max: 50,
      step: 1
    }).on('change', (ev) => {
      this.triggerCanvasSettingChange('GRID_X_LINES', ev.value)
    })

    gridFolder.addBinding(canvasData, 'gridYLines', {
      label: 'Y Lines',
      min: 2,
      max: 50,
      step: 1
    }).on('change', (ev) => {
      this.triggerCanvasSettingChange('GRID_Y_LINES', ev.value)
    })

    gridFolder.addBinding(canvasData, 'gridColor', {
      label: 'Grid Color',
      picker: 'inline'
    }).on('change', (ev) => {
      this.triggerCanvasSettingChange('GRID_COLOR', ev.value)
    })
    this.updateFolderVisibility(gridFolder, canvasData.gridEnabled)

    canvasFolder.addBinding(canvasData, 'noiseOverlay', {
      label: 'Noise Overlay'
    }).on('change', (ev) => {
      this.triggerCanvasSettingChange('NOISE_OVERLAY', ev.value)
      this.updateFolderVisibility(noiseFolder, ev.value)
    })

    const noiseFolder = canvasFolder.addFolder({ title: 'Noise Settings', expanded: true })
    noiseFolder.addBinding(canvasData, 'noiseAnimate', {
      label: 'Animate'
    }).on('change', (ev) => {
      this.triggerCanvasSettingChange('NOISE_ANIMATE', ev.value)
    })

    noiseFolder.addBinding(canvasData, 'noiseOpacity', {
      label: 'Opacity',
      min: 0.01,
      max: 0.2,
      step: 0.01
    }).on('change', (ev) => {
      this.triggerCanvasSettingChange('NOISE_OPACITY', ev.value)
    })

    noiseFolder.addBinding(canvasData, 'noisePatternWidth', {
      label: 'Pattern Width',
      min: 50,
      max: 200,
      step: 10
    }).on('change', (ev) => {
      this.triggerCanvasSettingChange('NOISE_PATTERN_WIDTH', ev.value)
    })

    noiseFolder.addBinding(canvasData, 'noisePatternHeight', {
      label: 'Pattern Height',
      min: 50,
      max: 200,
      step: 10
    }).on('change', (ev) => {
      this.triggerCanvasSettingChange('NOISE_PATTERN_HEIGHT', ev.value)
    })

    noiseFolder.addBinding(canvasData, 'noiseDensity', {
      label: 'Density',
      min: 0.5,
      max: 2,
      step: 0.1
    }).on('change', (ev) => {
      this.triggerCanvasSettingChange('NOISE_DENSITY', ev.value)
    })

    noiseFolder.addBinding(canvasData, 'noiseWidth', {
      label: 'Grain Width',
      min: 0.5,
      max: 3,
      step: 0.1
    }).on('change', (ev) => {
      this.triggerCanvasSettingChange('NOISE_WIDTH', ev.value)
    })

    noiseFolder.addBinding(canvasData, 'noiseHeight', {
      label: 'Grain Height',
      min: 0.5,
      max: 3,
      step: 0.1
    }).on('change', (ev) => {
      this.triggerCanvasSettingChange('NOISE_HEIGHT', ev.value)
    })
    this.updateFolderVisibility(noiseFolder, canvasData.noiseOverlay)

    canvasFolder.addBinding(canvasData, 'ditherOverlay', {
      label: 'Dither Overlay'
    }).on('change', (ev) => {
      this.triggerCanvasSettingChange('DITHER_OVERLAY', ev.value)
      this.updateFolderVisibility(ditherFolder, ev.value)
    })

    const ditherFolder = canvasFolder.addFolder({ title: 'Dither Settings', expanded: true })
    ditherFolder.addBinding(canvasData, 'ditherSaturate', {
      label: 'Saturation',
      min: 0,
      max: 1,
      step: 0.1
    }).on('change', (ev) => {
      this.triggerCanvasSettingChange('DITHER_SATURATE', ev.value)
    })

    ditherFolder.addBinding(canvasData, 'ditherTableValuesR', {
      label: 'Red Table Values',
      min: 0,
      max: 1,
      step: 0.1
    }).on('change', (ev) => {
      const tableValues = this.sliderToTableValues(ev.value)
      this.triggerCanvasSettingChange('DITHER_TABLE_VALUES_R', tableValues)
    })

    ditherFolder.addBinding(canvasData, 'ditherTableValuesG', {
      label: 'Green Table Values',
      min: 0,
      max: 1,
      step: 0.1
    }).on('change', (ev) => {
      const tableValues = this.sliderToTableValues(ev.value)
      this.triggerCanvasSettingChange('DITHER_TABLE_VALUES_G', tableValues)
    })

    ditherFolder.addBinding(canvasData, 'ditherTableValuesB', {
      label: 'Blue Table Values',
      min: 0,
      max: 1,
      step: 0.1
    }).on('change', (ev) => {
      const tableValues = this.sliderToTableValues(ev.value)
      this.triggerCanvasSettingChange('DITHER_TABLE_VALUES_B', tableValues)
    })
    this.updateFolderVisibility(ditherFolder, canvasData.ditherOverlay)

    canvasFolder.addBinding(canvasData, 'chromaticAberrationEnabled', {
      label: 'Chromatic Aberration'
    }).on('change', (ev) => {
      this.triggerCanvasSettingChange('CHROMATIC_ABERRATION_ENABLED', ev.value)
      this.updateFolderVisibility(chromaticAberrationFolder, ev.value)
    })

    const chromaticAberrationFolder = canvasFolder.addFolder({ title: 'Chromatic Aberration Settings', expanded: true })
    chromaticAberrationFolder.addBinding(canvasData, 'chromaticAberrationContrast', {
      label: 'Contrast',
      min: 1,
      max: 10,
      step: 0.1
    }).on('change', (ev) => {
      this.triggerCanvasSettingChange('CHROMATIC_ABERRATION_CONTRAST', ev.value)
    })
    this.updateFolderVisibility(chromaticAberrationFolder, canvasData.chromaticAberrationEnabled)

    canvasFolder.addBinding(canvasData, 'invertFilter', {
      label: 'Invert Filter',
      min: 0,
      max: 100,
      step: 1
    }).on('change', (ev) => {
      this.triggerCanvasSettingChange('INVERT_FILTER', ev.value)
    })

    const colorPaletteFolder = this.mainPane.addFolder({ title: 'Color Palettes', expanded: true })

    const sotoPaletteData = {}
    colorSettings.SOTO_PALETTE.forEach((color, index) => {
      sotoPaletteData[`color${index}`] = color
    })

    const sotoPaletteFolder = colorPaletteFolder.addFolder({ title: 'Soto Palette', expanded: true })
    colorSettings.SOTO_PALETTE.forEach((color, index) => {
      sotoPaletteFolder.addBinding(sotoPaletteData, `color${index}`, {
        label: `Color ${index + 1}`,
        picker: 'inline'
      }).on('change', (ev) => {
        this.triggerColorPaletteChange('soto', index, ev.value)
      })
    })

    const polygonPaletteData = {}
    colorSettings.POLYGON_COLORS.forEach((color, index) => {
      polygonPaletteData[`color${index}`] = color
    })

    const polygonPaletteFolder = colorPaletteFolder.addFolder({ title: 'Polygon Colors', expanded: true })
    colorSettings.POLYGON_COLORS.forEach((color, index) => {
      polygonPaletteFolder.addBinding(polygonPaletteData, `color${index}`, {
        label: `Color ${index + 1}`,
        picker: 'inline'
      }).on('change', (ev) => {
        this.triggerColorPaletteChange('polygon', index, ev.value)
      })
    })

    const pitchColorFolder = this.mainPane.addFolder({ title: 'Pitch to Color Generator', expanded: true })

    pitchColorFolder.addBinding(pitchColorData, 'hueFactor', {
      label: 'Hue Factor',
      min: 1,
      max: 100,
      step: 1
    }).on('change', (ev) => {
      this.updatePitchColorExample(ev.value)
      this.triggerPitchColorFactorChange(ev.value)
    })

    const exampleContainer = document.createElement('div')
    exampleContainer.id = 'pitchColorExample'
    exampleContainer.className = 'pitch-color-example'
    
    setTimeout(() => {
      const pitchColorElement = pitchColorFolder.element || pitchColorFolder.element_ || (pitchColorFolder.controller && pitchColorFolder.controller.view && pitchColorFolder.controller.view.element)
      if (pitchColorElement) {
        const hueFactorBinding = pitchColorElement.querySelector('.tp-lblv')
        if (hueFactorBinding) {
          const parent = hueFactorBinding.closest('.tp-fldv') || hueFactorBinding.parentElement
          if (parent) {
            parent.appendChild(exampleContainer)
            this.updatePitchColorExample(pitchColorData.hueFactor)
          }
        }
      }
    }, 100)
  }

  updateFolderVisibility (folder, visible) {
    if (!folder) return
    setTimeout(() => {
      const folderElement = folder.element || folder.element_ || (folder.controller && folder.controller.view && folder.controller.view.element)
      if (folderElement) {
        const folderContainer = folderElement.closest('.tp-fldv') || folderElement.parentElement
        if (folderContainer) {
          folderContainer.style.display = visible ? '' : 'none'
        }
      }
    }, 50)
  }

  parseTableValuesToSlider (tableValues) {
    if (!tableValues) return 0
    const values = tableValues.split(' ').map(v => parseFloat(v.trim())).filter(v => !isNaN(v))
    if (values.length === 0) return 0
    return values[0]
  }

  sliderToTableValues (sliderValue) {
    const value = Math.max(0, Math.min(1, sliderValue))
    return `${value} ${1 - value}`
  }

  updatePitchColorExample (factor) {
    const exampleContainer = document.querySelector('#pitchColorExample')
    if (!exampleContainer) return

    const cScaleNotes = [60, 62, 64, 65, 67, 69, 71, 72]
    const noteNames = ['C', 'D', 'E', 'F', 'G', 'A', 'B', 'C']

    exampleContainer.innerHTML = cScaleNotes.map((note, index) => {
      const hue = (note % 14) * factor
      const color = `hsla(${hue}, 100%, 70%, 0.6)`
      return `
        <div class="pitch-color-item" style="background-color: ${color};">
          <span>${noteNames[index]}</span>
        </div>
      `
    }).join('')
  }

  triggerCanvasSettingChange (setting, value) {
    const event = new CustomEvent('canvasSettingChange', {
      detail: { setting, value }
    })
    this.panel.dispatchEvent(event)
  }

  triggerColorPaletteChange (palette, index, color) {
    const event = new CustomEvent('colorPaletteChange', {
      detail: { palette, index, color }
    })
    this.panel.dispatchEvent(event)
  }

  triggerPitchColorFactorChange (value) {
    const event = new CustomEvent('pitchColorFactorChange', {
      detail: { value }
    })
    this.panel.dispatchEvent(event)
  }
}
