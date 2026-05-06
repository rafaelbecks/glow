import { Pane } from '../lib/tweakpane.min.js'
import { UTILS } from '../settings.js'
import {
  FLUID_BACKGROUND_MODES,
  getBackgroundModePaneOptions
} from '../shaders/background/registry.js'

export class CanvasUIManager {
  constructor (panel) {
    this.panel = panel
    this.settings = null
    this.mainPane = null
  }

  rgbToHex (rgb) {
    const r = Math.round(rgb.r * 255)
      .toString(16)
      .padStart(2, '0')
    const g = Math.round(rgb.g * 255)
      .toString(16)
      .padStart(2, '0')
    const b = Math.round(rgb.b * 255)
      .toString(16)
      .padStart(2, '0')
    return `#${r}${g}${b}`
  }

  hexToRgb (hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result
      ? {
          r: parseInt(result[1], 16) / 255,
          g: parseInt(result[2], 16) / 255,
          b: parseInt(result[3], 16) / 255
        }
      : { r: 0, g: 0, b: 0 }
  }

  setSettings (settings) {
    this.settings = settings
  }

  renderCanvasControls () {
    const canvasControlsContainer = this.panel.querySelector(
      '#canvasControlsContainer'
    )
    if (!canvasControlsContainer) return

    if (this.mainPane) {
      this.mainPane.dispose()
      this.mainPane = null
    }

    canvasControlsContainer.innerHTML =
      '<div id="canvas-pane-container"></div>'

    const paneContainer = canvasControlsContainer.querySelector(
      '#canvas-pane-container'
    )
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
      SOTO_PALETTE: [
        '#EF4136',
        '#005BBB',
        '#FCEE09',
        '#2E7D32',
        '#FFFFFF',
        '#4A148C',
        '#8B0000'
      ],
      POLYGON_COLORS: [
        '#f93822',
        '#fcdc4d',
        '#00a6a6',
        '#90be6d',
        '#f94144',
        '#ff006e',
        '#8338ec'
      ]
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
      ditherTableValuesR: this.parseTableValuesToSlider(
        canvasSettings.DITHER_TABLE_VALUES_R || '0 1'
      ),
      ditherTableValuesG: this.parseTableValuesToSlider(
        canvasSettings.DITHER_TABLE_VALUES_G || '0 1'
      ),
      ditherTableValuesB: this.parseTableValuesToSlider(
        canvasSettings.DITHER_TABLE_VALUES_B || '0 1'
      ),
      chromaticAberrationEnabled:
        canvasSettings.CHROMATIC_ABERRATION_ENABLED || false,
      chromaticAberrationContrast:
        canvasSettings.CHROMATIC_ABERRATION_CONTRAST || 1,
      invertFilter: canvasSettings.INVERT_FILTER || 0,
      shaderBackgroundEnabled:
        canvasSettings.SHADER_BACKGROUND_ENABLED || false,
      shaderBackgroundMode: canvasSettings.SHADER_BACKGROUND_MODE || 'Fluid',
      shaderBackgroundTrailLength:
        canvasSettings.SHADER_BACKGROUND_TRAIL_LENGTH || 15,
      shaderBackgroundColorFluidBackground: this.rgbToHex(
        canvasSettings.SHADER_BACKGROUND_COLOR_FLUID_BACKGROUND || {
          r: 0.02,
          g: 0.078,
          b: 0.157
        }
      ),
      shaderBackgroundColorFluidTrail: this.rgbToHex(
        canvasSettings.SHADER_BACKGROUND_COLOR_FLUID_TRAIL || {
          r: 0.125,
          g: 0.227,
          b: 0.136
        }
      ),
      shaderBackgroundColorPressure: this.rgbToHex(
        canvasSettings.SHADER_BACKGROUND_COLOR_PRESSURE || {
          r: 0.02,
          g: 0.078,
          b: 0.157
        }
      ),
      shaderBackgroundColorVelocity: this.rgbToHex(
        canvasSettings.SHADER_BACKGROUND_COLOR_VELOCITY || {
          r: 0.259,
          g: 0.227,
          b: 0.184
        }
      ),
      shaderBackgroundCursorMode:
        canvasSettings.SHADER_BACKGROUND_CURSOR_MODE !== false,
      shaderBackgroundPortalTimeOffset:
        canvasSettings.SHADER_BACKGROUND_PORTAL_TIME_OFFSET ?? 4,
      shaderBackgroundPortalTimeDivisor:
        canvasSettings.SHADER_BACKGROUND_PORTAL_TIME_DIVISOR ?? 15,
      shaderBackgroundPortalBrightness:
        canvasSettings.SHADER_BACKGROUND_PORTAL_BRIGHTNESS ?? 0.15,
      shaderBackgroundDiscoPaletteVariant:
        canvasSettings.SHADER_BACKGROUND_DISCO_PALETTE_VARIANT ?? 0,
      shaderBackgroundDiscoPaletteBase:
        canvasSettings.SHADER_BACKGROUND_DISCO_PALETTE_BASE ?? 6,
      shaderBackgroundDiscoPaletteWave:
        canvasSettings.SHADER_BACKGROUND_DISCO_PALETTE_WAVE ?? 50,
      shaderBackgroundDiscoShimmer:
        canvasSettings.SHADER_BACKGROUND_DISCO_SHIMMER ?? 20,
      shaderBackgroundBalatroSpinRotation:
        canvasSettings.SHADER_BACKGROUND_BALATRO_SPIN_ROTATION ?? -2,
      shaderBackgroundBalatroSpinSpeed:
        canvasSettings.SHADER_BACKGROUND_BALATRO_SPIN_SPEED ?? 7,
      shaderBackgroundBalatroOffsetX:
        canvasSettings.SHADER_BACKGROUND_BALATRO_OFFSET_X ?? 0,
      shaderBackgroundBalatroOffsetY:
        canvasSettings.SHADER_BACKGROUND_BALATRO_OFFSET_Y ?? 0,
      shaderBackgroundBalatroColor1: this.rgbToHex(
        canvasSettings.SHADER_BACKGROUND_BALATRO_COLOR_1 || {
          r: 0.871,
          g: 0.267,
          b: 0.231
        }
      ),
      shaderBackgroundBalatroColor2: this.rgbToHex(
        canvasSettings.SHADER_BACKGROUND_BALATRO_COLOR_2 || {
          r: 0,
          g: 0.42,
          b: 0.706
        }
      ),
      shaderBackgroundBalatroColor3: this.rgbToHex(
        canvasSettings.SHADER_BACKGROUND_BALATRO_COLOR_3 || {
          r: 0.086,
          g: 0.137,
          b: 0.145
        }
      ),
      shaderBackgroundBalatroContrast:
        canvasSettings.SHADER_BACKGROUND_BALATRO_CONTRAST ?? 3.5,
      shaderBackgroundBalatroLighting:
        canvasSettings.SHADER_BACKGROUND_BALATRO_LIGHTING ?? 0.4,
      shaderBackgroundBalatroSpinAmount:
        canvasSettings.SHADER_BACKGROUND_BALATRO_SPIN_AMOUNT ?? 0.25,
      shaderBackgroundBalatroPixelFilter:
        canvasSettings.SHADER_BACKGROUND_BALATRO_PIXEL_FILTER ?? 745,
      shaderBackgroundBalatroSpinEase:
        canvasSettings.SHADER_BACKGROUND_BALATRO_SPIN_EASE ?? 1,
      shaderBackgroundBalatroIsRotate:
        canvasSettings.SHADER_BACKGROUND_BALATRO_IS_ROTATE === true,
      shaderBackgroundChromaNoiseTimeScale:
        canvasSettings.SHADER_BACKGROUND_CHROMA_NOISE_TIME_SCALE ?? 0.2,
      shaderBackgroundChromaNoiseUvScale:
        canvasSettings.SHADER_BACKGROUND_CHROMA_NOISE_UV_SCALE ?? 0.9,
      shaderBackgroundChromaFineNoiseScale:
        canvasSettings.SHADER_BACKGROUND_CHROMA_FINE_NOISE_SCALE ?? 300,
      shaderBackgroundChromaGrainMix:
        canvasSettings.SHADER_BACKGROUND_CHROMA_GRAIN_MIX ?? 0.08,
      shaderBackgroundChromaColorA: this.rgbToHex(
        canvasSettings.SHADER_BACKGROUND_CHROMA_COLOR_A || {
          r: 1,
          g: 0.5,
          b: 0
        }
      ),
      shaderBackgroundChromaColorB: this.rgbToHex(
        canvasSettings.SHADER_BACKGROUND_CHROMA_COLOR_B || {
          r: 0.75,
          g: 0.3,
          b: 1
        }
      ),
      shaderBackgroundChromaColorAMul:
        canvasSettings.SHADER_BACKGROUND_CHROMA_COLOR_A_MUL ?? 1.3,
      shaderBackgroundChromaColorBMul:
        canvasSettings.SHADER_BACKGROUND_CHROMA_COLOR_B_MUL ?? 0.9,
      shaderBackgroundChromaMixClampMin:
        canvasSettings.SHADER_BACKGROUND_CHROMA_MIX_CLAMP_MIN ?? -0.14,
      shaderBackgroundChromaMixClampMax:
        canvasSettings.SHADER_BACKGROUND_CHROMA_MIX_CLAMP_MAX ?? 0.9,
      shaderBackgroundChromaLayer1S:
        canvasSettings.SHADER_BACKGROUND_CHROMA_LAYER1_S ?? 1.2,
      shaderBackgroundChromaLayer2S:
        canvasSettings.SHADER_BACKGROUND_CHROMA_LAYER2_S ?? 1.5,
      shaderBackgroundChromaLayer1Z:
        canvasSettings.SHADER_BACKGROUND_CHROMA_LAYER1_Z ?? 1.1,
      shaderBackgroundChromaLayer2Z:
        canvasSettings.SHADER_BACKGROUND_CHROMA_LAYER2_Z ?? 1.4,
      glassOverlayEnabled: canvasSettings.GLASS_OVERLAY_ENABLED || false,
      glassOverlayMode: canvasSettings.GLASS_OVERLAY_MODE || 'single',
      glassOverlayWidth: canvasSettings.GLASS_OVERLAY_WIDTH ?? 200,
      glassOverlayHeight: canvasSettings.GLASS_OVERLAY_HEIGHT ?? 200,
      glassOverlayRadius: canvasSettings.GLASS_OVERLAY_RADIUS ?? 27,
      glassOverlayThickness: canvasSettings.GLASS_OVERLAY_THICKNESS ?? 200,
      glassOverlayBezel: canvasSettings.GLASS_OVERLAY_BEZEL ?? 60,
      glassOverlayIOR: canvasSettings.GLASS_OVERLAY_IOR ?? 3.0,
      glassOverlayBlur: canvasSettings.GLASS_OVERLAY_BLUR ?? 9.5,
      glassOverlaySpecular: canvasSettings.GLASS_OVERLAY_SPECULAR ?? 0.35,
      glassOverlayTint: canvasSettings.GLASS_OVERLAY_TINT ?? 0,
      glassOverlayShadow: canvasSettings.GLASS_OVERLAY_SHADOW ?? 0.0,
      glassOverlayBrickSize: canvasSettings.GLASS_OVERLAY_BRICK_SIZE ?? 200,
      glassOverlayBrickOffsetX:
        canvasSettings.GLASS_OVERLAY_BRICK_OFFSET_X ?? 0,
      glassOverlayBrickOffsetY:
        canvasSettings.GLASS_OVERLAY_BRICK_OFFSET_Y ?? 0,
      glassOverlayBrickGap: canvasSettings.GLASS_OVERLAY_BRICK_GAP ?? 8
    }

    const pitchColorData = {
      hueFactor: UTILS.pitchColorFactor || 30
    }

    const canvasFolder = this.mainPane.addFolder({
      title: 'Canvas Settings',
      expanded: true
    })

    canvasFolder
      .addBinding(canvasData, 'clearAlpha', {
        label: 'Clear Alpha',
        min: 0,
        max: 1,
        step: 0.01
      })
      .on('change', (ev) => {
        this.triggerCanvasSettingChange('CLEAR_ALPHA', ev.value)
      })

    canvasFolder
      .addBinding(canvasData, 'backgroundColor', {
        label: 'Background Color',
        picker: 'inline'
      })
      .on('change', (ev) => {
        this.triggerCanvasSettingChange('BACKGROUND_COLOR', ev.value)
      })

    canvasFolder
      .addBinding(canvasData, 'crtMode', {
        label: 'CRT Mode'
      })
      .on('change', (ev) => {
        this.triggerCanvasSettingChange('CRT_MODE', ev.value)
        this.updateFolderVisibility(crtIntensityFolder, ev.value)
      })

    const crtIntensityFolder = canvasFolder.addFolder({
      title: 'CRT Intensity',
      expanded: true
    })
    crtIntensityFolder
      .addBinding(canvasData, 'crtIntensity', {
        label: 'Intensity',
        min: 80,
        max: 200,
        step: 5
      })
      .on('change', (ev) => {
        this.triggerCanvasSettingChange('CRT_INTENSITY', ev.value)
      })
    this.updateFolderVisibility(crtIntensityFolder, canvasData.crtMode)

    canvasFolder
      .addBinding(canvasData, 'lumiaEffect', {
        label: 'Lumia Effect',
        min: 0,
        max: 100,
        step: 5
      })
      .on('change', (ev) => {
        this.triggerCanvasSettingChange('LUMIA_EFFECT', ev.value)
      })

    canvasFolder
      .addBinding(canvasData, 'gridEnabled', {
        label: 'Background Grid'
      })
      .on('change', (ev) => {
        this.triggerCanvasSettingChange('GRID_ENABLED', ev.value)
        this.updateFolderVisibility(gridFolder, ev.value)
      })

    const gridFolder = canvasFolder.addFolder({
      title: 'Grid Settings',
      expanded: true
    })
    gridFolder
      .addBinding(canvasData, 'gridXLines', {
        label: 'X Lines',
        min: 2,
        max: 50,
        step: 1
      })
      .on('change', (ev) => {
        this.triggerCanvasSettingChange('GRID_X_LINES', ev.value)
      })

    gridFolder
      .addBinding(canvasData, 'gridYLines', {
        label: 'Y Lines',
        min: 2,
        max: 50,
        step: 1
      })
      .on('change', (ev) => {
        this.triggerCanvasSettingChange('GRID_Y_LINES', ev.value)
      })

    gridFolder
      .addBinding(canvasData, 'gridColor', {
        label: 'Grid Color',
        picker: 'inline'
      })
      .on('change', (ev) => {
        this.triggerCanvasSettingChange('GRID_COLOR', ev.value)
      })
    this.updateFolderVisibility(gridFolder, canvasData.gridEnabled)

    canvasFolder
      .addBinding(canvasData, 'noiseOverlay', {
        label: 'Noise Overlay'
      })
      .on('change', (ev) => {
        this.triggerCanvasSettingChange('NOISE_OVERLAY', ev.value)
        this.updateFolderVisibility(noiseFolder, ev.value)
      })

    const noiseFolder = canvasFolder.addFolder({
      title: 'Noise Settings',
      expanded: true
    })
    noiseFolder
      .addBinding(canvasData, 'noiseAnimate', {
        label: 'Animate'
      })
      .on('change', (ev) => {
        this.triggerCanvasSettingChange('NOISE_ANIMATE', ev.value)
      })

    noiseFolder
      .addBinding(canvasData, 'noiseOpacity', {
        label: 'Opacity',
        min: 0.01,
        max: 0.2,
        step: 0.01
      })
      .on('change', (ev) => {
        this.triggerCanvasSettingChange('NOISE_OPACITY', ev.value)
      })

    noiseFolder
      .addBinding(canvasData, 'noisePatternWidth', {
        label: 'Pattern Width',
        min: 50,
        max: 200,
        step: 10
      })
      .on('change', (ev) => {
        this.triggerCanvasSettingChange('NOISE_PATTERN_WIDTH', ev.value)
      })

    noiseFolder
      .addBinding(canvasData, 'noisePatternHeight', {
        label: 'Pattern Height',
        min: 50,
        max: 200,
        step: 10
      })
      .on('change', (ev) => {
        this.triggerCanvasSettingChange('NOISE_PATTERN_HEIGHT', ev.value)
      })

    noiseFolder
      .addBinding(canvasData, 'noiseDensity', {
        label: 'Density',
        min: 0.5,
        max: 2,
        step: 0.1
      })
      .on('change', (ev) => {
        this.triggerCanvasSettingChange('NOISE_DENSITY', ev.value)
      })

    noiseFolder
      .addBinding(canvasData, 'noiseWidth', {
        label: 'Grain Width',
        min: 0.5,
        max: 3,
        step: 0.1
      })
      .on('change', (ev) => {
        this.triggerCanvasSettingChange('NOISE_WIDTH', ev.value)
      })

    noiseFolder
      .addBinding(canvasData, 'noiseHeight', {
        label: 'Grain Height',
        min: 0.5,
        max: 3,
        step: 0.1
      })
      .on('change', (ev) => {
        this.triggerCanvasSettingChange('NOISE_HEIGHT', ev.value)
      })
    this.updateFolderVisibility(noiseFolder, canvasData.noiseOverlay)

    canvasFolder
      .addBinding(canvasData, 'ditherOverlay', {
        label: 'Dither Overlay'
      })
      .on('change', (ev) => {
        this.triggerCanvasSettingChange('DITHER_OVERLAY', ev.value)
        this.updateFolderVisibility(ditherFolder, ev.value)
      })

    const ditherFolder = canvasFolder.addFolder({
      title: 'Dither Settings',
      expanded: true
    })
    ditherFolder
      .addBinding(canvasData, 'ditherSaturate', {
        label: 'Saturation',
        min: 0,
        max: 1,
        step: 0.1
      })
      .on('change', (ev) => {
        this.triggerCanvasSettingChange('DITHER_SATURATE', ev.value)
      })

    ditherFolder
      .addBinding(canvasData, 'ditherTableValuesR', {
        label: 'Red Table Values',
        min: 0,
        max: 1,
        step: 0.1
      })
      .on('change', (ev) => {
        const tableValues = this.sliderToTableValues(ev.value)
        this.triggerCanvasSettingChange('DITHER_TABLE_VALUES_R', tableValues)
      })

    ditherFolder
      .addBinding(canvasData, 'ditherTableValuesG', {
        label: 'Green Table Values',
        min: 0,
        max: 1,
        step: 0.1
      })
      .on('change', (ev) => {
        const tableValues = this.sliderToTableValues(ev.value)
        this.triggerCanvasSettingChange('DITHER_TABLE_VALUES_G', tableValues)
      })

    ditherFolder
      .addBinding(canvasData, 'ditherTableValuesB', {
        label: 'Blue Table Values',
        min: 0,
        max: 1,
        step: 0.1
      })
      .on('change', (ev) => {
        const tableValues = this.sliderToTableValues(ev.value)
        this.triggerCanvasSettingChange('DITHER_TABLE_VALUES_B', tableValues)
      })
    this.updateFolderVisibility(ditherFolder, canvasData.ditherOverlay)

    canvasFolder
      .addBinding(canvasData, 'chromaticAberrationEnabled', {
        label: 'Chromatic Aberration'
      })
      .on('change', (ev) => {
        this.triggerCanvasSettingChange(
          'CHROMATIC_ABERRATION_ENABLED',
          ev.value
        )
        this.updateFolderVisibility(chromaticAberrationFolder, ev.value)
      })

    const chromaticAberrationFolder = canvasFolder.addFolder({
      title: 'Chromatic Aberration Settings',
      expanded: true
    })
    chromaticAberrationFolder
      .addBinding(canvasData, 'chromaticAberrationContrast', {
        label: 'Contrast',
        min: 1,
        max: 10,
        step: 0.1
      })
      .on('change', (ev) => {
        this.triggerCanvasSettingChange(
          'CHROMATIC_ABERRATION_CONTRAST',
          ev.value
        )
      })
    this.updateFolderVisibility(
      chromaticAberrationFolder,
      canvasData.chromaticAberrationEnabled
    )

    canvasFolder
      .addBinding(canvasData, 'invertFilter', {
        label: 'Invert Filter',
        min: 0,
        max: 100,
        step: 1
      })
      .on('change', (ev) => {
        this.triggerCanvasSettingChange('INVERT_FILTER', ev.value)
      })

    const shaderBgParamFolders = {}
    let shaderBackgroundFolder = null

    canvasFolder
      .addBinding(canvasData, 'shaderBackgroundEnabled', {
        label: 'Shader Background'
      })
      .on('change', (ev) => {
        this.triggerCanvasSettingChange('SHADER_BACKGROUND_ENABLED', ev.value)
        if (shaderBackgroundFolder) {
          this.updateFolderVisibility(shaderBackgroundFolder, ev.value)
        }
        this.refreshShaderBackgroundParamVisibility(
          ev.value,
          canvasData.shaderBackgroundMode,
          shaderBgParamFolders
        )
      })

    shaderBackgroundFolder = canvasFolder.addFolder({
      title: 'Shader Background',
      expanded: true
    })

    shaderBackgroundFolder
      .addBinding(canvasData, 'shaderBackgroundMode', {
        label: 'Mode',
        options: getBackgroundModePaneOptions()
      })
      .on('change', (ev) => {
        this.triggerCanvasSettingChange('SHADER_BACKGROUND_MODE', ev.value)
        this.refreshShaderBackgroundParamVisibility(
          canvasData.shaderBackgroundEnabled,
          ev.value,
          shaderBgParamFolders
        )
      })

    const fluidShaderBgFolder = shaderBackgroundFolder.addFolder({
      title: 'Fluid simulation',
      expanded: true
    })
    shaderBgParamFolders.fluid = fluidShaderBgFolder

    fluidShaderBgFolder
      .addBinding(canvasData, 'shaderBackgroundTrailLength', {
        label: 'Trail Length',
        min: 0,
        max: 100,
        step: 1
      })
      .on('change', (ev) => {
        this.triggerCanvasSettingChange(
          'SHADER_BACKGROUND_TRAIL_LENGTH',
          ev.value
        )
      })

    fluidShaderBgFolder
      .addBinding(canvasData, 'shaderBackgroundColorFluidBackground', {
        label: 'Fluid Background',
        view: 'color'
      })
      .on('change', (ev) => {
        this.triggerCanvasSettingChange(
          'SHADER_BACKGROUND_COLOR_FLUID_BACKGROUND',
          this.hexToRgb(ev.value)
        )
      })

    fluidShaderBgFolder
      .addBinding(canvasData, 'shaderBackgroundColorFluidTrail', {
        label: 'Fluid Trail',
        view: 'color'
      })
      .on('change', (ev) => {
        this.triggerCanvasSettingChange(
          'SHADER_BACKGROUND_COLOR_FLUID_TRAIL',
          this.hexToRgb(ev.value)
        )
      })

    fluidShaderBgFolder
      .addBinding(canvasData, 'shaderBackgroundColorPressure', {
        label: 'Pressure Color',
        view: 'color'
      })
      .on('change', (ev) => {
        this.triggerCanvasSettingChange(
          'SHADER_BACKGROUND_COLOR_PRESSURE',
          this.hexToRgb(ev.value)
        )
      })

    fluidShaderBgFolder
      .addBinding(canvasData, 'shaderBackgroundColorVelocity', {
        label: 'Velocity Color',
        view: 'color'
      })
      .on('change', (ev) => {
        this.triggerCanvasSettingChange(
          'SHADER_BACKGROUND_COLOR_VELOCITY',
          this.hexToRgb(ev.value)
        )
      })

    fluidShaderBgFolder
      .addBinding(canvasData, 'shaderBackgroundCursorMode', {
        label: 'Cursor Mode'
      })
      .on('change', (ev) => {
        this.triggerCanvasSettingChange(
          'SHADER_BACKGROUND_CURSOR_MODE',
          ev.value
        )
      })

    const portalFolder = shaderBackgroundFolder.addFolder({
      title: 'Portal',
      expanded: true
    })
    shaderBgParamFolders.portal = portalFolder
    portalFolder
      .addBinding(canvasData, 'shaderBackgroundPortalTimeOffset', {
        label: 'Time offset',
        min: -20,
        max: 20,
        step: 0.5
      })
      .on('change', (ev) => {
        this.triggerCanvasSettingChange(
          'SHADER_BACKGROUND_PORTAL_TIME_OFFSET',
          ev.value
        )
      })
    portalFolder
      .addBinding(canvasData, 'shaderBackgroundPortalTimeDivisor', {
        label: 'Time scale divisor',
        min: 1,
        max: 60,
        step: 0.5
      })
      .on('change', (ev) => {
        this.triggerCanvasSettingChange(
          'SHADER_BACKGROUND_PORTAL_TIME_DIVISOR',
          ev.value
        )
      })
    portalFolder
      .addBinding(canvasData, 'shaderBackgroundPortalBrightness', {
        label: 'Brightness',
        min: 0.02,
        max: 0.5,
        step: 0.01
      })
      .on('change', (ev) => {
        this.triggerCanvasSettingChange(
          'SHADER_BACKGROUND_PORTAL_BRIGHTNESS',
          ev.value
        )
      })

    const discoFolder = shaderBackgroundFolder.addFolder({
      title: 'Disco Sun Vortex',
      expanded: true
    })
    shaderBgParamFolders.disco = discoFolder
    discoFolder
      .addBinding(canvasData, 'shaderBackgroundDiscoPaletteVariant', {
        label: 'Palette',
        options: { Warm: 0, Cool: 1 }
      })
      .on('change', (ev) => {
        this.triggerCanvasSettingChange(
          'SHADER_BACKGROUND_DISCO_PALETTE_VARIANT',
          ev.value
        )
      })
    discoFolder
      .addBinding(canvasData, 'shaderBackgroundDiscoPaletteBase', {
        label: 'Palette depth base',
        min: 0.5,
        max: 20,
        step: 0.1
      })
      .on('change', (ev) => {
        this.triggerCanvasSettingChange(
          'SHADER_BACKGROUND_DISCO_PALETTE_BASE',
          ev.value
        )
      })
    discoFolder
      .addBinding(canvasData, 'shaderBackgroundDiscoPaletteWave', {
        label: 'Palette wave amp',
        min: 1,
        max: 120,
        step: 1
      })
      .on('change', (ev) => {
        this.triggerCanvasSettingChange(
          'SHADER_BACKGROUND_DISCO_PALETTE_WAVE',
          ev.value
        )
      })
    discoFolder
      .addBinding(canvasData, 'shaderBackgroundDiscoShimmer', {
        label: 'Shimmer strength',
        min: 0,
        max: 60,
        step: 0.5
      })
      .on('change', (ev) => {
        this.triggerCanvasSettingChange(
          'SHADER_BACKGROUND_DISCO_SHIMMER',
          ev.value
        )
      })

    const balatroFolder = shaderBackgroundFolder.addFolder({
      title: 'Balatro',
      expanded: true
    })
    shaderBgParamFolders.balatro = balatroFolder
    balatroFolder
      .addBinding(canvasData, 'shaderBackgroundBalatroColor1', {
        label: 'Colour 1',
        view: 'color'
      })
      .on('change', (ev) => {
        this.triggerCanvasSettingChange(
          'SHADER_BACKGROUND_BALATRO_COLOR_1',
          this.hexToRgb(ev.value)
        )
      })
    balatroFolder
      .addBinding(canvasData, 'shaderBackgroundBalatroColor2', {
        label: 'Colour 2',
        view: 'color'
      })
      .on('change', (ev) => {
        this.triggerCanvasSettingChange(
          'SHADER_BACKGROUND_BALATRO_COLOR_2',
          this.hexToRgb(ev.value)
        )
      })
    balatroFolder
      .addBinding(canvasData, 'shaderBackgroundBalatroColor3', {
        label: 'Colour 3',
        view: 'color'
      })
      .on('change', (ev) => {
        this.triggerCanvasSettingChange(
          'SHADER_BACKGROUND_BALATRO_COLOR_3',
          this.hexToRgb(ev.value)
        )
      })
    balatroFolder
      .addBinding(canvasData, 'shaderBackgroundBalatroContrast', {
        label: 'Contrast',
        min: 0.5,
        max: 8,
        step: 0.1
      })
      .on('change', (ev) => {
        this.triggerCanvasSettingChange(
          'SHADER_BACKGROUND_BALATRO_CONTRAST',
          ev.value
        )
      })
    balatroFolder
      .addBinding(canvasData, 'shaderBackgroundBalatroLighting', {
        label: 'Lighting',
        min: 0,
        max: 1.5,
        step: 0.05
      })
      .on('change', (ev) => {
        this.triggerCanvasSettingChange(
          'SHADER_BACKGROUND_BALATRO_LIGHTING',
          ev.value
        )
      })
    balatroFolder
      .addBinding(canvasData, 'shaderBackgroundBalatroSpinSpeed', {
        label: 'Spin speed',
        min: 0,
        max: 20,
        step: 0.1
      })
      .on('change', (ev) => {
        this.triggerCanvasSettingChange(
          'SHADER_BACKGROUND_BALATRO_SPIN_SPEED',
          ev.value
        )
      })
    balatroFolder
      .addBinding(canvasData, 'shaderBackgroundBalatroSpinRotation', {
        label: 'Spin rotation',
        min: -10,
        max: 10,
        step: 0.1
      })
      .on('change', (ev) => {
        this.triggerCanvasSettingChange(
          'SHADER_BACKGROUND_BALATRO_SPIN_ROTATION',
          ev.value
        )
      })
    balatroFolder
      .addBinding(canvasData, 'shaderBackgroundBalatroSpinAmount', {
        label: 'Spin amount',
        min: 0,
        max: 1,
        step: 0.01
      })
      .on('change', (ev) => {
        this.triggerCanvasSettingChange(
          'SHADER_BACKGROUND_BALATRO_SPIN_AMOUNT',
          ev.value
        )
      })
    balatroFolder
      .addBinding(canvasData, 'shaderBackgroundBalatroPixelFilter', {
        label: 'Pixel filter',
        min: 100,
        max: 2000,
        step: 5
      })
      .on('change', (ev) => {
        this.triggerCanvasSettingChange(
          'SHADER_BACKGROUND_BALATRO_PIXEL_FILTER',
          ev.value
        )
      })
    balatroFolder
      .addBinding(canvasData, 'shaderBackgroundBalatroSpinEase', {
        label: 'Spin ease',
        min: 0,
        max: 3,
        step: 0.05
      })
      .on('change', (ev) => {
        this.triggerCanvasSettingChange(
          'SHADER_BACKGROUND_BALATRO_SPIN_EASE',
          ev.value
        )
      })
    balatroFolder
      .addBinding(canvasData, 'shaderBackgroundBalatroOffsetX', {
        label: 'Offset X',
        min: -0.5,
        max: 0.5,
        step: 0.01
      })
      .on('change', (ev) => {
        this.triggerCanvasSettingChange(
          'SHADER_BACKGROUND_BALATRO_OFFSET_X',
          ev.value
        )
      })
    balatroFolder
      .addBinding(canvasData, 'shaderBackgroundBalatroOffsetY', {
        label: 'Offset Y',
        min: -0.5,
        max: 0.5,
        step: 0.01
      })
      .on('change', (ev) => {
        this.triggerCanvasSettingChange(
          'SHADER_BACKGROUND_BALATRO_OFFSET_Y',
          ev.value
        )
      })
    balatroFolder
      .addBinding(canvasData, 'shaderBackgroundBalatroIsRotate', {
        label: 'Rotate with time'
      })
      .on('change', (ev) => {
        this.triggerCanvasSettingChange(
          'SHADER_BACKGROUND_BALATRO_IS_ROTATE',
          ev.value
        )
      })

    const chromaFolder = shaderBackgroundFolder.addFolder({
      title: 'Chroma gradients',
      expanded: true
    })
    shaderBgParamFolders.chroma = chromaFolder
    chromaFolder
      .addBinding(canvasData, 'shaderBackgroundChromaNoiseTimeScale', {
        label: 'Noise time scale',
        min: 0.01,
        max: 1,
        step: 0.01
      })
      .on('change', (ev) => {
        this.triggerCanvasSettingChange(
          'SHADER_BACKGROUND_CHROMA_NOISE_TIME_SCALE',
          ev.value
        )
      })
    chromaFolder
      .addBinding(canvasData, 'shaderBackgroundChromaNoiseUvScale', {
        label: 'Noise UV scale',
        min: 0.1,
        max: 3,
        step: 0.05
      })
      .on('change', (ev) => {
        this.triggerCanvasSettingChange(
          'SHADER_BACKGROUND_CHROMA_NOISE_UV_SCALE',
          ev.value
        )
      })
    chromaFolder
      .addBinding(canvasData, 'shaderBackgroundChromaFineNoiseScale', {
        label: 'Fine noise scale',
        min: 50,
        max: 600,
        step: 5
      })
      .on('change', (ev) => {
        this.triggerCanvasSettingChange(
          'SHADER_BACKGROUND_CHROMA_FINE_NOISE_SCALE',
          ev.value
        )
      })
    chromaFolder
      .addBinding(canvasData, 'shaderBackgroundChromaGrainMix', {
        label: 'Grain mix',
        min: 0,
        max: 0.3,
        step: 0.005
      })
      .on('change', (ev) => {
        this.triggerCanvasSettingChange(
          'SHADER_BACKGROUND_CHROMA_GRAIN_MIX',
          ev.value
        )
      })
    chromaFolder
      .addBinding(canvasData, 'shaderBackgroundChromaColorA', {
        label: 'Color A',
        view: 'color'
      })
      .on('change', (ev) => {
        this.triggerCanvasSettingChange(
          'SHADER_BACKGROUND_CHROMA_COLOR_A',
          this.hexToRgb(ev.value)
        )
      })
    chromaFolder
      .addBinding(canvasData, 'shaderBackgroundChromaColorB', {
        label: 'Color B',
        view: 'color'
      })
      .on('change', (ev) => {
        this.triggerCanvasSettingChange(
          'SHADER_BACKGROUND_CHROMA_COLOR_B',
          this.hexToRgb(ev.value)
        )
      })
    chromaFolder
      .addBinding(canvasData, 'shaderBackgroundChromaColorAMul', {
        label: 'Color A intensity',
        min: 0,
        max: 3,
        step: 0.05
      })
      .on('change', (ev) => {
        this.triggerCanvasSettingChange(
          'SHADER_BACKGROUND_CHROMA_COLOR_A_MUL',
          ev.value
        )
      })
    chromaFolder
      .addBinding(canvasData, 'shaderBackgroundChromaColorBMul', {
        label: 'Color B intensity',
        min: 0,
        max: 3,
        step: 0.05
      })
      .on('change', (ev) => {
        this.triggerCanvasSettingChange(
          'SHADER_BACKGROUND_CHROMA_COLOR_B_MUL',
          ev.value
        )
      })
    chromaFolder
      .addBinding(canvasData, 'shaderBackgroundChromaMixClampMin', {
        label: 'Mix clamp min',
        min: -1,
        max: 1,
        step: 0.02
      })
      .on('change', (ev) => {
        this.triggerCanvasSettingChange(
          'SHADER_BACKGROUND_CHROMA_MIX_CLAMP_MIN',
          ev.value
        )
      })
    chromaFolder
      .addBinding(canvasData, 'shaderBackgroundChromaMixClampMax', {
        label: 'Mix clamp max',
        min: -1,
        max: 1.5,
        step: 0.02
      })
      .on('change', (ev) => {
        this.triggerCanvasSettingChange(
          'SHADER_BACKGROUND_CHROMA_MIX_CLAMP_MAX',
          ev.value
        )
      })
    chromaFolder
      .addBinding(canvasData, 'shaderBackgroundChromaLayer1S', {
        label: 'Layer 1 softness',
        min: 0.2,
        max: 3,
        step: 0.05
      })
      .on('change', (ev) => {
        this.triggerCanvasSettingChange(
          'SHADER_BACKGROUND_CHROMA_LAYER1_S',
          ev.value
        )
      })
    chromaFolder
      .addBinding(canvasData, 'shaderBackgroundChromaLayer2S', {
        label: 'Layer 2 softness',
        min: 0.2,
        max: 3,
        step: 0.05
      })
      .on('change', (ev) => {
        this.triggerCanvasSettingChange(
          'SHADER_BACKGROUND_CHROMA_LAYER2_S',
          ev.value
        )
      })
    chromaFolder
      .addBinding(canvasData, 'shaderBackgroundChromaLayer1Z', {
        label: 'Layer 1 Z',
        min: 0.2,
        max: 3,
        step: 0.05
      })
      .on('change', (ev) => {
        this.triggerCanvasSettingChange(
          'SHADER_BACKGROUND_CHROMA_LAYER1_Z',
          ev.value
        )
      })
    chromaFolder
      .addBinding(canvasData, 'shaderBackgroundChromaLayer2Z', {
        label: 'Layer 2 Z',
        min: 0.2,
        max: 3,
        step: 0.05
      })
      .on('change', (ev) => {
        this.triggerCanvasSettingChange(
          'SHADER_BACKGROUND_CHROMA_LAYER2_Z',
          ev.value
        )
      })
    this.updateFolderVisibility(
      shaderBackgroundFolder,
      canvasData.shaderBackgroundEnabled
    )
    this.refreshShaderBackgroundParamVisibility(
      canvasData.shaderBackgroundEnabled,
      canvasData.shaderBackgroundMode,
      shaderBgParamFolders
    )

    const glassOverlayFolder = canvasFolder.addFolder({
      title: 'Glass overlay',
      expanded: true
    })
    glassOverlayFolder
      .addBinding(canvasData, 'glassOverlayEnabled', {
        label: 'Enabled'
      })
      .on('change', (ev) => {
        this.triggerCanvasSettingChange('GLASS_OVERLAY_ENABLED', ev.value)
        this.updateFolderVisibility(glassParamsFolder, ev.value)
      })

    const glassParamsFolder = glassOverlayFolder.addFolder({
      title: 'Params',
      expanded: true
    })
    glassParamsFolder
      .addBinding(canvasData, 'glassOverlayMode', {
        label: 'Mode',
        options: { Single: 'single', Bricks: 'bricks' }
      })
      .on('change', (ev) => {
        this.triggerCanvasSettingChange('GLASS_OVERLAY_MODE', ev.value)
      })
    glassParamsFolder
      .addBinding(canvasData, 'glassOverlayWidth', {
        label: 'Width',
        min: 20,
        max: 2000,
        step: 1
      })
      .on('change', (ev) =>
        this.triggerCanvasSettingChange('GLASS_OVERLAY_WIDTH', ev.value)
      )
    glassParamsFolder
      .addBinding(canvasData, 'glassOverlayHeight', {
        label: 'Height',
        min: 20,
        max: 2000,
        step: 1
      })
      .on('change', (ev) =>
        this.triggerCanvasSettingChange('GLASS_OVERLAY_HEIGHT', ev.value)
      )
    glassParamsFolder
      .addBinding(canvasData, 'glassOverlayRadius', {
        label: 'Radius',
        min: 2,
        max: 200,
        step: 1
      })
      .on('change', (ev) =>
        this.triggerCanvasSettingChange('GLASS_OVERLAY_RADIUS', ev.value)
      )
    glassParamsFolder
      .addBinding(canvasData, 'glassOverlayThickness', {
        label: 'Thickness',
        min: 1,
        max: 300,
        step: 1
      })
      .on('change', (ev) =>
        this.triggerCanvasSettingChange('GLASS_OVERLAY_THICKNESS', ev.value)
      )
    glassParamsFolder
      .addBinding(canvasData, 'glassOverlayBezel', {
        label: 'Bezel',
        min: 1,
        max: 120,
        step: 1
      })
      .on('change', (ev) =>
        this.triggerCanvasSettingChange('GLASS_OVERLAY_BEZEL', ev.value)
      )
    glassParamsFolder
      .addBinding(canvasData, 'glassOverlayIOR', {
        label: 'IOR',
        min: 1,
        max: 3,
        step: 0.05
      })
      .on('change', (ev) =>
        this.triggerCanvasSettingChange('GLASS_OVERLAY_IOR', ev.value)
      )
    glassParamsFolder
      .addBinding(canvasData, 'glassOverlayBlur', {
        label: 'Blur',
        min: 0,
        max: 20,
        step: 0.1
      })
      .on('change', (ev) =>
        this.triggerCanvasSettingChange('GLASS_OVERLAY_BLUR', ev.value)
      )
    glassParamsFolder
      .addBinding(canvasData, 'glassOverlaySpecular', {
        label: 'Specular',
        min: 0,
        max: 1,
        step: 0.01
      })
      .on('change', (ev) =>
        this.triggerCanvasSettingChange('GLASS_OVERLAY_SPECULAR', ev.value)
      )
    glassParamsFolder
      .addBinding(canvasData, 'glassOverlayTint', {
        label: 'Tint',
        min: 0,
        max: 1,
        step: 0.01
      })
      .on('change', (ev) =>
        this.triggerCanvasSettingChange('GLASS_OVERLAY_TINT', ev.value)
      )
    glassParamsFolder
      .addBinding(canvasData, 'glassOverlayShadow', {
        label: 'Shadow',
        min: 0,
        max: 1,
        step: 0.01
      })
      .on('change', (ev) =>
        this.triggerCanvasSettingChange('GLASS_OVERLAY_SHADOW', ev.value)
      )
    glassParamsFolder
      .addBinding(canvasData, 'glassOverlayBrickSize', {
        label: 'Brick size',
        min: 30,
        max: 600,
        step: 1
      })
      .on('change', (ev) =>
        this.triggerCanvasSettingChange('GLASS_OVERLAY_BRICK_SIZE', ev.value)
      )
    glassParamsFolder
      .addBinding(canvasData, 'glassOverlayBrickOffsetX', {
        label: 'Brick offset X',
        min: -2000,
        max: 2000,
        step: 1
      })
      .on('change', (ev) =>
        this.triggerCanvasSettingChange(
          'GLASS_OVERLAY_BRICK_OFFSET_X',
          ev.value
        )
      )
    glassParamsFolder
      .addBinding(canvasData, 'glassOverlayBrickOffsetY', {
        label: 'Brick offset Y',
        min: -2000,
        max: 2000,
        step: 1
      })
      .on('change', (ev) =>
        this.triggerCanvasSettingChange(
          'GLASS_OVERLAY_BRICK_OFFSET_Y',
          ev.value
        )
      )
    glassParamsFolder
      .addBinding(canvasData, 'glassOverlayBrickGap', {
        label: 'Brick gap',
        min: 0,
        max: 80,
        step: 1
      })
      .on('change', (ev) =>
        this.triggerCanvasSettingChange('GLASS_OVERLAY_BRICK_GAP', ev.value)
      )
    this.updateFolderVisibility(
      glassParamsFolder,
      canvasData.glassOverlayEnabled
    )

    const colorPaletteFolder = this.mainPane.addFolder({
      title: 'Color Palettes',
      expanded: true
    })

    const sotoPaletteData = {}
    colorSettings.SOTO_PALETTE.forEach((color, index) => {
      sotoPaletteData[`color${index}`] = color
    })

    const sotoPaletteFolder = colorPaletteFolder.addFolder({
      title: 'Soto Palette',
      expanded: true
    })
    colorSettings.SOTO_PALETTE.forEach((color, index) => {
      sotoPaletteFolder
        .addBinding(sotoPaletteData, `color${index}`, {
          label: `Color ${index + 1}`,
          picker: 'inline'
        })
        .on('change', (ev) => {
          this.triggerColorPaletteChange('soto', index, ev.value)
        })
    })

    const polygonPaletteData = {}
    colorSettings.POLYGON_COLORS.forEach((color, index) => {
      polygonPaletteData[`color${index}`] = color
    })

    const polygonPaletteFolder = colorPaletteFolder.addFolder({
      title: 'Polygon Colors',
      expanded: true
    })
    colorSettings.POLYGON_COLORS.forEach((color, index) => {
      polygonPaletteFolder
        .addBinding(polygonPaletteData, `color${index}`, {
          label: `Color ${index + 1}`,
          picker: 'inline'
        })
        .on('change', (ev) => {
          this.triggerColorPaletteChange('polygon', index, ev.value)
        })
    })

    const pitchColorFolder = this.mainPane.addFolder({
      title: 'Pitch to Color Generator',
      expanded: true
    })

    pitchColorFolder
      .addBinding(pitchColorData, 'hueFactor', {
        label: 'Hue Factor',
        min: 1,
        max: 100,
        step: 1
      })
      .on('change', (ev) => {
        this.updatePitchColorExample(ev.value)
        this.triggerPitchColorFactorChange(ev.value)
      })

    const exampleContainer = document.createElement('div')
    exampleContainer.id = 'pitchColorExample'
    exampleContainer.className = 'pitch-color-example'

    setTimeout(() => {
      const pitchColorElement =
        pitchColorFolder.element ||
        pitchColorFolder.element_ ||
        (pitchColorFolder.controller &&
          pitchColorFolder.controller.view &&
          pitchColorFolder.controller.view.element)
      if (pitchColorElement) {
        const hueFactorBinding = pitchColorElement.querySelector('.tp-lblv')
        if (hueFactorBinding) {
          const parent =
            hueFactorBinding.closest('.tp-fldv') ||
            hueFactorBinding.parentElement
          if (parent) {
            parent.appendChild(exampleContainer)
            this.updatePitchColorExample(pitchColorData.hueFactor)
          }
        }
      }
    }, 100)
  }

  refreshShaderBackgroundParamVisibility (enabled, mode, folders) {
    if (!folders) return
    const fluidOn = enabled && FLUID_BACKGROUND_MODES.includes(mode)
    this.updateFolderVisibility(folders.fluid, fluidOn)
    this.updateFolderVisibility(folders.portal, enabled && mode === 'Portal')
    this.updateFolderVisibility(
      folders.disco,
      enabled && mode === 'DiscoSunVortex'
    )
    this.updateFolderVisibility(folders.balatro, enabled && mode === 'Balatro')
    this.updateFolderVisibility(
      folders.chroma,
      enabled && mode === 'ChromaGradients'
    )
  }

  updateFolderVisibility (folder, visible) {
    if (!folder) return
    if ('hidden' in folder) {
      try {
        folder.hidden = !visible
      } catch (_) {
        /* older tweakpane */
      }
    }
    setTimeout(() => {
      const folderElement =
        folder.element ||
        folder.element_ ||
        (folder.controller &&
          folder.controller.view &&
          folder.controller.view.element)
      if (folderElement) {
        const folderContainer =
          folderElement.closest('.tp-fldv') || folderElement.parentElement
        if (folderContainer) {
          folderContainer.style.display = visible ? '' : 'none'
        }
      }
    }, 50)
  }

  parseTableValuesToSlider (tableValues) {
    if (!tableValues) return 0
    const values = tableValues
      .split(' ')
      .map((v) => parseFloat(v.trim()))
      .filter((v) => !isNaN(v))
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

    exampleContainer.innerHTML = cScaleNotes
      .map((note, index) => {
        const hue = (note % 14) * factor
        const color = `hsla(${hue}, 100%, 70%, 0.6)`
        return `
        <div class="pitch-color-item" style="background-color: ${color};">
          <span>${noteNames[index]}</span>
        </div>
      `
      })
      .join('')
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
