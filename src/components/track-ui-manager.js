import { Pane } from '../lib/tweakpane.min.js'
import * as RotationPlugin from 'https://unpkg.com/@0b5vr/tweakpane-plugin-rotation@0.2.0/dist/tweakpane-plugin-rotation.js'
import {
  hasLuminodeConfig,
  getLuminodeConfig
} from '../luminode-configs.js'
import {
  getLuminodeDisplayName,
  getLuminodeSettingsKey as getLuminodeSettingsKeyFromRegistry
} from '../luminodes/index.js'
import { OSCILLATION_WAVE_SHAPE_NAMES } from '../line-modulation-system.js'
import { UTILS, PITCH_PALETTE_MAX_SIZE } from '../settings.js'

export { getLuminodeDisplayName as normalizeLuminodeName }

export class TrackUIManager {
  constructor (trackManager, panel, luminodeConfigManager = null, midiGenerator = null) {
    this.trackManager = trackManager
    this.panel = panel
    this.luminodeConfigManager = luminodeConfigManager
    this.midiGenerator = midiGenerator
    this.luminodePicker = null
    this.onEditLuminode = null
    this.onGeneratorChanged = null
    this.settings = null
    this.trackPanes = new Map()
    this.mainPane = null
  }

  setSettings (settings) {
    this.settings = settings
  }

  setLuminodePicker (picker) {
    this.luminodePicker = picker
  }

  setOnEditLuminode (callback) {
    this.onEditLuminode = callback
  }

  setOnGeneratorChanged (callback) {
    this.onGeneratorChanged = callback
  }

  setMidiGenerator (midiGenerator) {
    this.midiGenerator = midiGenerator
  }

  renderTracks () {
    const tracksContainer = this.panel.querySelector('#tracksContainer')
    const tracks = this.trackManager.getTracks()
    if (!tracks.length) return

    if (this.mainPane) {
      this.mainPane.dispose()
      this.mainPane = null
    }
    this.trackPanes.clear()

    tracksContainer.innerHTML = '<div id="track-pane-container"></div>'

    const paneContainer = tracksContainer.querySelector(
      '#track-pane-container'
    )
    if (!paneContainer) return

    this.mainPane = new Pane({ container: paneContainer })
    this.mainPane.registerPlugin(RotationPlugin)

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

    const tabs = this.mainPane.addTab({
      pages: tracks.map((track) => ({ title: `Track ${track.id}` }))
    })

    tracks.forEach((track, index) => {
      this.createTrackPane(tabs.pages[index], track)
    })
  }

  createTrackPane (tabPage, track) {
    try {
      const pane = tabPage

      const trackControls = {
        muted: track.muted,
        solo: track.solo
      }

      const trackHeaderContainer = document.createElement('div')
      trackHeaderContainer.className = 'track-tab-header'
      trackHeaderContainer.innerHTML = `
        <div class="track-info">
          <div class="track-number" style="background-color: ${this.getTrackColor(track.id)}">${track.id}</div>
          <div class="track-activity-indicator" id="activity-${track.id}"></div>
        </div>
        <div class="track-controls">
          <button class="mute-btn ${track.muted ? 'active' : ''}" data-action="mute" title="Mute">M</button>
          <button class="solo-btn ${track.solo ? 'active' : ''}" data-action="solo" title="Solo">S</button>
        </div>
      `

      const muteBtn = trackHeaderContainer.querySelector('.mute-btn')
      const soloBtn = trackHeaderContainer.querySelector('.solo-btn')

      if (muteBtn) {
        muteBtn.addEventListener('click', () => {
          this.trackManager.toggleMute(track.id)
        })
      }

      if (soloBtn) {
        soloBtn.addEventListener('click', () => {
          this.trackManager.toggleSolo(track.id)
        })
      }

      const insertHeader = () => {
        const paneElement =
          pane.element ||
          pane.element_ ||
          (pane.controller &&
            pane.controller.view &&
            pane.controller.view.element)
        if (paneElement) {
          const tabContent =
            paneElement.querySelector('.tp-tabv_c') ||
            paneElement.querySelector('.tp-rotv') ||
            paneElement
          if (tabContent && tabContent.firstChild) {
            tabContent.insertBefore(
              trackHeaderContainer,
              tabContent.firstChild
            )
            return true
          }
        }
        return false
      }

      if (!insertHeader()) {
        requestAnimationFrame(() => {
          if (!insertHeader()) {
            setTimeout(insertHeader, 100)
          }
        })
      }

      const midiDevices = this.trackManager.getAvailableMidiDevices()
      const midiDeviceOptions = { 'Select Device': '' }
      midiDevices.forEach((device) => {
        midiDeviceOptions[device.name] = device.id
      })

      const trackData = {
        midiDevice: track.midiDevice || '',
        luminode: track.luminode || ''
      }

      const midiBinding = pane
        .addBinding(trackData, 'midiDevice', {
          options: midiDeviceOptions,
          label: 'MIDI Device'
        })
        .on('change', (ev) => {
          this.trackManager.setMidiDevice(track.id, ev.value || null)
        })

      const generatorDiceIcon = this.attachGeneratorDiceIcon(
        midiBinding,
        track.id
      )

      const luminodeBinding = pane
        .addButton({
          title: this.getLuminodeButtonTitle(track.luminode),
          label: 'Luminode'
        })
        .on('click', () => {
          this.openLuminodePicker(track.id)
        })

      const editLuminodeIcon = this.attachLuminodeEditIcon(
        luminodeBinding,
        track.id,
        Boolean(track.luminode)
      )

      let layoutData = null
      let trajectoryData = null
      let lineModulationData = null

      if (track.luminode !== 'triangle') {
        layoutData = {
          position: { x: track.layout.x, y: track.layout.y },
          rotation: track.layout.rotation
        }

        const layoutFolder = pane.addFolder({
          title: 'Layout',
          expanded: true
        })
        const positionBinding = layoutFolder
          .addBinding(layoutData, 'position', {
            label: 'Position',
            picker: 'inline',
            expanded: true,
            x: { min: -500, max: 500, step: 10 },
            y: { min: -500, max: 500, step: 10 }
          })
          .on('change', (ev) => {
            this.trackManager.setLayout(track.id, {
              x: ev.value.x,
              y: ev.value.y
            })
          })

        setTimeout(() => {
          const positionElement = positionBinding.element
          if (positionElement) {
            const textContainer = positionElement.querySelector('.tp-pndtxtv')
            if (textContainer) {
              const inputs = textContainer.querySelectorAll(
                '.tp-pndtxtv_a input'
              )
              if (inputs.length >= 2) {
                const xInput = inputs[0]
                const yInput = inputs[1]
                if (
                  xInput &&
                  !xInput.parentElement.querySelector('.axis-label-x')
                ) {
                  const xLabel = document.createElement('span')
                  xLabel.className = 'axis-label axis-label-x'
                  xLabel.textContent = 'X:'
                  xInput.parentElement.insertBefore(xLabel, xInput)
                }
                if (
                  yInput &&
                  !yInput.parentElement.querySelector('.axis-label-y')
                ) {
                  const yLabel = document.createElement('span')
                  yLabel.className = 'axis-label axis-label-y'
                  yLabel.textContent = 'Y:'
                  yInput.parentElement.insertBefore(yLabel, yInput)
                }
              }
            }
          }
        }, 150)

        layoutFolder
          .addBinding(layoutData, 'rotation', {
            label: 'R',
            min: -180,
            max: 180,
            step: 5
          })
          .on('change', (ev) => {
            this.trackManager.setLayout(track.id, { rotation: ev.value })
          })

        const trajectoryConfig = this.getTrajectoryConfig(track.id)
        trajectoryData = {
          enabled: trajectoryConfig.enabled,
          trajectoryType: trajectoryConfig.trajectoryType,
          motionRate: trajectoryConfig.motionRate,
          amplitude: trajectoryConfig.amplitude,
          ratioA: trajectoryConfig.ratioA,
          ratioB: trajectoryConfig.ratioB,
          ratioC: trajectoryConfig.ratioC,
          inversion: trajectoryConfig.inversion
        }

        const typeNames = this.trackManager.getTrajectoryTypeNames()
        const typeOptions = Object.fromEntries(
          Object.entries(typeNames).map(([value, label]) => [label, value])
        )

        const trajectoryFolder = pane.addFolder({
          title: 'Trajectory Motion',
          expanded: true
        })
        trajectoryFolder
          .addBinding(trajectoryData, 'enabled', {
            label: 'Enable Motion'
          })
          .on('change', (ev) => {
            this.trackManager.updateTrajectoryConfig(track.id, {
              enabled: ev.value
            })
          })

        trajectoryFolder
          .addBinding(trajectoryData, 'trajectoryType', {
            options: typeOptions,
            label: 'Type'
          })
          .on('change', (ev) => {
            this.trackManager.updateTrajectoryConfig(track.id, {
              trajectoryType: ev.value
            })
          })

        trajectoryFolder
          .addBinding(trajectoryData, 'motionRate', {
            label: 'Rate',
            min: 0.01,
            max: 2.0,
            step: 0.01
          })
          .on('change', (ev) => {
            this.trackManager.updateTrajectoryConfig(track.id, {
              motionRate: ev.value
            })
          })

        trajectoryFolder
          .addBinding(trajectoryData, 'amplitude', {
            label: 'Amplitude',
            min: 0,
            max: 600,
            step: 1
          })
          .on('change', (ev) => {
            this.trackManager.updateTrajectoryConfig(track.id, {
              amplitude: ev.value
            })
          })

        trajectoryFolder
          .addBinding(trajectoryData, 'ratioA', {
            label: 'Ratio A',
            min: 0.1,
            max: 5.0,
            step: 0.1
          })
          .on('change', (ev) => {
            this.trackManager.updateTrajectoryConfig(track.id, {
              ratioA: ev.value
            })
          })

        trajectoryFolder
          .addBinding(trajectoryData, 'ratioB', {
            label: 'Ratio B',
            min: 0.1,
            max: 5.0,
            step: 0.1
          })
          .on('change', (ev) => {
            this.trackManager.updateTrajectoryConfig(track.id, {
              ratioB: ev.value
            })
        })

        trajectoryFolder
          .addBinding(trajectoryData, 'inversion', {
            label: 'Invert Motion'
          })
          .on('change', (ev) => {
            this.trackManager.updateTrajectoryConfig(track.id, {
              inversion: ev.value
            })
          })

        const lineConfig = this.getLineModulationConfig(track.id)
        lineModulationData = {
          enabled: lineConfig.enabled,
          oscAmount: lineConfig.oscillation.amount,
          oscFrequency: lineConfig.oscillation.frequency,
          oscSpeed: lineConfig.oscillation.speed,
          oscPhase: lineConfig.oscillation.phase,
          oscWave: lineConfig.oscillation.wave || 'sine',
          noiseAmount: lineConfig.noise.amount,
          noiseScale: lineConfig.noise.scale,
          noiseSpeed: lineConfig.noise.speed
        }

        const deformationFolder = pane.addFolder({
          title: 'Deformation',
          expanded: true
        })
        deformationFolder
          .addBinding(lineModulationData, 'enabled', {
            label: 'Enabled'
          })
          .on('change', (ev) => {
            this.trackManager.updateLineModulationConfig(track.id, {
              enabled: ev.value
            })
          })

        const deformationTabs = deformationFolder.addTab({
          pages: [
            { title: 'Oscillation' },
            { title: 'Noise' }
          ]
        })
        const oscTab = deformationTabs.pages[0]
        const noiseTab = deformationTabs.pages[1]

        const waveOptions = Object.fromEntries(
          Object.entries(OSCILLATION_WAVE_SHAPE_NAMES).map(([value, label]) => [
            label,
            value
          ])
        )
        oscTab
          .addBinding(lineModulationData, 'oscWave', {
            label: 'Wave',
            options: waveOptions
          })
          .on('change', (ev) => {
            this.trackManager.updateLineModulationConfig(track.id, {
              oscillation: { wave: ev.value }
            })
          })
        oscTab
          .addBinding(lineModulationData, 'oscAmount', {
            label: 'Amount',
            min: 0,
            max: 80,
            step: 0.5
          })
          .on('change', (ev) => {
            this.trackManager.updateLineModulationConfig(track.id, {
              oscillation: { amount: ev.value }
            })
          })
        oscTab
          .addBinding(lineModulationData, 'oscFrequency', {
            label: 'Frequency',
            min: 0.01,
            max: 2,
            step: 0.01
          })
          .on('change', (ev) => {
            this.trackManager.updateLineModulationConfig(track.id, {
              oscillation: { frequency: ev.value }
            })
          })
        oscTab
          .addBinding(lineModulationData, 'oscSpeed', {
            label: 'Speed',
            min: 0,
            max: 5,
            step: 0.01
          })
          .on('change', (ev) => {
            this.trackManager.updateLineModulationConfig(track.id, {
              oscillation: { speed: ev.value }
            })
          })
        oscTab
          .addBinding(lineModulationData, 'oscPhase', {
            label: 'Phase',
            min: 0,
            max: Math.PI * 2,
            step: 0.01
          })
          .on('change', (ev) => {
            this.trackManager.updateLineModulationConfig(track.id, {
              oscillation: { phase: ev.value }
            })
          })

        noiseTab
          .addBinding(lineModulationData, 'noiseAmount', {
            label: 'Amount',
            min: 0,
            max: 80,
            step: 0.5
          })
          .on('change', (ev) => {
            this.trackManager.updateLineModulationConfig(track.id, {
              noise: { amount: ev.value }
            })
          })
        noiseTab
          .addBinding(lineModulationData, 'noiseScale', {
            label: 'Scale',
            min: 0.001,
            max: 0.2,
            step: 0.001
          })
          .on('change', (ev) => {
            this.trackManager.updateLineModulationConfig(track.id, {
              noise: { scale: ev.value }
            })
          })
        noiseTab
          .addBinding(lineModulationData, 'noiseSpeed', {
            label: 'Speed',
            min: 0,
            max: 5,
            step: 0.01
          })
          .on('change', (ev) => {
            this.trackManager.updateLineModulationConfig(track.id, {
              noise: { speed: ev.value }
            })
          })
      }

      let luminodeFolder = null
      if (track.luminode && hasLuminodeConfig(track.luminode)) {
        luminodeFolder = this.createLuminodeConfigFolder(pane, track)
      }

      let pitchPaletteFolder = null
      let pitchPaletteData = null
      let pitchSwatchContainer = null
      if (track.luminode) {
        const pitchCreated = this.createPitchPaletteFolder(pane, track)
        pitchPaletteFolder = pitchCreated?.folder || null
        pitchPaletteData = pitchCreated?.data || null
        pitchSwatchContainer = pitchCreated?.swatchContainer || null
      }

      this.trackPanes.set(track.id, {
        pane,
        trackData,
        layoutData,
        trajectoryData,
        lineModulationData,
        luminodeFolder,
        pitchPaletteFolder,
        pitchPaletteData,
        pitchSwatchContainer,
        midiBinding,
        luminodeBinding,
        editLuminodeIcon,
        generatorDiceIcon,
        trackHeaderContainer
      })
    } catch (error) {
      console.error(
        `Failed to create track pane for track ${track.id}:`,
        error
      )
    }
  }

  getLuminodeButtonTitle (luminode) {
    if (!luminode) return 'Select…'
    return this.normalizeLuminodeName(luminode)
  }

  attachLuminodeEditIcon (luminodeBinding, trackId, enabled) {
    const iconBtn = document.createElement('button')
    iconBtn.type = 'button'
    iconBtn.className = 'luminode-edit-icon'
    iconBtn.title = 'Edit in Lab'
    iconBtn.setAttribute('aria-label', 'Edit luminode in Lab')
    iconBtn.innerHTML = '<ion-icon name="code-slash-outline"></ion-icon>'
    iconBtn.disabled = !enabled
    iconBtn.hidden = !enabled
    iconBtn.addEventListener('click', (e) => {
      e.preventDefault()
      e.stopPropagation()
      this.openLuminodeInLab(trackId)
    })

    this.mountTrackActionIcon(luminodeBinding, iconBtn, {
      existingSelector: '.luminode-edit-icon',
      hostClass: 'luminode-blade-with-edit',
      valueSelector: '.tp-btnv'
    })
    return iconBtn
  }

  attachGeneratorDiceIcon (midiBinding, trackId) {
    const iconBtn = document.createElement('button')
    iconBtn.type = 'button'
    iconBtn.className = 'luminode-generator-icon'
    iconBtn.title = 'Add / randomize MIDI generator'
    iconBtn.setAttribute('aria-label', 'Add or randomize MIDI generator for this track')
    iconBtn.innerHTML = '<ion-icon name="dice-outline"></ion-icon>'
    iconBtn.addEventListener('click', (e) => {
      e.preventDefault()
      e.stopPropagation()
      this.handleGeneratorDiceClick(trackId)
    })

    this.mountTrackActionIcon(midiBinding, iconBtn, {
      existingSelector: '.luminode-generator-icon',
      hostClass: 'midi-blade-with-dice',
      valueSelector: '.tp-lstv, .tp-sldv, .tp-btnv'
    })
    this.updateGeneratorDiceIcon(trackId, iconBtn)
    return iconBtn
  }

  mountTrackActionIcon (binding, iconBtn, options = {}) {
    const {
      existingSelector,
      hostClass = 'luminode-blade-with-edit',
      valueSelector = '.tp-btnv'
    } = options

    const mount = () => {
      const row = binding?.element
      if (!row || row.querySelector(existingSelector)) return true

      const valueView = row.querySelector(valueSelector)
      const host = valueView?.parentElement || row
      if (!host) return false

      host.classList.add(hostClass)
      host.appendChild(iconBtn)
      return true
    }

    if (!mount()) {
      requestAnimationFrame(() => {
        if (!mount()) setTimeout(mount, 50)
      })
    }
  }

  handleGeneratorDiceClick (trackId) {
    if (!this.midiGenerator) return
    const result = this.midiGenerator.ensureOrRandomizeForTrack(trackId)
    if (!result) return
    this.updateGeneratorDiceIcon(trackId)
    if (typeof this.onGeneratorChanged === 'function') {
      this.onGeneratorChanged({ trackId, result })
    }
  }

  updateGeneratorDiceIcon (trackId, iconEl = null) {
    const paneData = this.trackPanes.get(trackId)
    const icon = iconEl || paneData?.generatorDiceIcon
    if (!icon || !this.midiGenerator) return
    const hasGenerator = Boolean(this.midiGenerator.getGeneratorForTrack(trackId))
    icon.classList.toggle('is-active', hasGenerator)
    icon.title = hasGenerator
      ? 'Randomize MIDI generator'
      : 'Add MIDI generator'
  }

  refreshGeneratorDiceIcons () {
    for (const trackId of this.trackPanes.keys()) {
      this.updateGeneratorDiceIcon(trackId)
    }
  }

  openLuminodePicker (trackId) {
    if (!this.luminodePicker) return
    const track = this.trackManager.getTrack(trackId)
    this.luminodePicker.show(trackId, track?.luminode || null)
  }

  openLuminodeInLab (trackId) {
    const track = this.trackManager.getTrack(trackId)
    if (!track?.luminode || !this.onEditLuminode) return
    this.onEditLuminode(track.luminode)
  }

  applyLuminodeSelection (trackId, luminode) {
    const paneData = this.trackPanes.get(trackId)
    this.trackManager.setLuminode(trackId, luminode)
    if (paneData?.trackData) {
      paneData.trackData.luminode = luminode || ''
    }
    this.updateLuminodeButtonTitle(trackId, luminode)
    this.updateLuminodeEditIcon(trackId, luminode)
    this.updateLuminodeConfigPane(trackId, luminode)
  }

  updateLuminodeButtonTitle (trackId, luminode) {
    const paneData = this.trackPanes.get(trackId)
    if (!paneData?.luminodeBinding) return

    const title = this.getLuminodeButtonTitle(luminode)
    try {
      paneData.luminodeBinding.title = title
    } catch (_) {
      try {
        paneData.luminodeBinding.controller?.props?.set('title', title)
      } catch (__) {}
    }
  }

  updateLuminodeEditIcon (trackId, luminode) {
    const paneData = this.trackPanes.get(trackId)
    const icon = paneData?.editLuminodeIcon
    if (!icon) return
    const enabled = Boolean(luminode)
    icon.disabled = !enabled
    icon.hidden = !enabled
  }

  createLuminodeConfigFolder (pane, track) {
    const luminodeName = track.luminode
    if (!luminodeName) return null

    const configParams = getLuminodeConfig(luminodeName)
    if (!configParams || configParams.length === 0) return null

    let currentValues = {}
    if (this.settings) {
      const settingsModule = this.settings.MODULES || this.settings
      const luminodeKey = this.getLuminodeSettingsKey(luminodeName)
      if (settingsModule[luminodeKey]) {
        currentValues = settingsModule[luminodeKey]
      }
    }

    const luminodeData = {}
    configParams.forEach((param) => {
      luminodeData[param.key] =
        currentValues[param.key] !== undefined
          ? currentValues[param.key]
          : param.default
    })

    const luminodeFolder = pane.addFolder({
      title: 'Luminode Parameters',
      expanded: true
    })

    configParams.forEach((param) => {
      if (param.type === 'rotation') {
        const rotationKey = param.key
        if (
          !luminodeData[rotationKey] ||
          typeof luminodeData[rotationKey] !== 'object'
        ) {
          luminodeData[rotationKey] = { x: 0, y: 0, z: 0 }
        }

        luminodeFolder
          .addBinding(luminodeData, rotationKey, {
            label: param.label,
            view: 'rotation',
            rotationMode: 'euler',
            order: 'XYZ',
            unit: 'deg',
            picker: 'inline',
            expanded: true
          })
          .on('change', (ev) => {
            this.triggerLuminodeConfigChange(
              track.id,
              luminodeName,
              rotationKey,
              ev.value
            )
          })
        return
      }

      const bindingOptions = {
        label: param.label
      }

      if (param.type === 'slider' || param.type === 'number') {
        bindingOptions.min = param.min
        bindingOptions.max = param.max
        bindingOptions.step = param.step
      } else if (param.type === 'select') {
        const options = param.options || []
        bindingOptions.options = Object.fromEntries(
          options.map((opt) => [opt.label, opt.value])
        )
      }

      luminodeFolder
        .addBinding(luminodeData, param.key, bindingOptions)
        .on('change', (ev) => {
          this.triggerLuminodeConfigChange(
            track.id,
            luminodeName,
            param.key,
            ev.value
          )
        })
    })

    return luminodeFolder
  }

  createPitchPaletteFolder (pane, track) {
    const paletteConfig = this.trackManager.getPitchPaletteConfig(track.id)
    const resolved = this.trackManager.getResolvedPitchPalette(track.id)

    const pitchPaletteData = {
      hueFactor:
        paletteConfig.pitchColorFactor ?? UTILS.pitchColorFactor ?? 30,
      paletteSize: UTILS.clampPitchPaletteSize(
        paletteConfig.pitchPaletteSize ?? UTILS.pitchPaletteSize
      )
    }

    let activePalette = resolved.palette?.length
      ? [...resolved.palette]
      : UTILS.generatePitchPalette(
          pitchPaletteData.hueFactor,
          pitchPaletteData.paletteSize
        )

    const pitchPaletteFolder = pane.addFolder({
      title: 'Pitch to Color Palette',
      expanded: true
    })

    const swatchContainer = document.createElement('div')
    swatchContainer.className = 'pitch-color-example track-pitch-color-example'
    swatchContainer.style.height = '246px'

    const applyPalette = (nextPalette) => {
      activePalette = [...nextPalette]
      this.trackManager.updatePitchPaletteConfig(track.id, {
        pitchPalette: nextPalette,
        pitchColorFactor: pitchPaletteData.hueFactor,
        pitchPaletteSize: pitchPaletteData.paletteSize
      })
      this.renderPitchPaletteSwatches(swatchContainer, nextPalette, (index, color) => {
        activePalette[index] = color
        this.trackManager.updatePitchPaletteConfig(track.id, {
          pitchPaletteIndex: index,
          pitchPaletteColor: color
        })
      })
    }

    pitchPaletteFolder
      .addBinding(pitchPaletteData, 'paletteSize', {
        label: 'Colors',
        min: 1,
        max: PITCH_PALETTE_MAX_SIZE,
        step: 1
      })
      .on('change', (ev) => {
        pitchPaletteData.paletteSize = UTILS.clampPitchPaletteSize(ev.value)
        const generated = UTILS.generatePitchPalette(
          pitchPaletteData.hueFactor,
          pitchPaletteData.paletteSize
        )
        applyPalette(generated.map((color, i) => activePalette[i] || color))
      })

    pitchPaletteFolder
      .addBinding(pitchPaletteData, 'hueFactor', {
        label: 'Hue Factor',
        min: 1,
        max: 100,
        step: 1
      })
      .on('change', (ev) => {
        pitchPaletteData.hueFactor = ev.value
        applyPalette(
          UTILS.generatePitchPalette(
            ev.value,
            pitchPaletteData.paletteSize
          )
        )
      })

    setTimeout(() => {
      const folderEl =
        pitchPaletteFolder.element ||
        pitchPaletteFolder.element_ ||
        (pitchPaletteFolder.controller &&
          pitchPaletteFolder.controller.view &&
          pitchPaletteFolder.controller.view.element)
      if (!folderEl) return
      const folderBody =
        folderEl.querySelector('.tp-fldv_c') ||
        folderEl.querySelector('.tp-fldv') ||
        folderEl
      folderBody.appendChild(swatchContainer)
      this.renderPitchPaletteSwatches(swatchContainer, activePalette, (index, color) => {
        activePalette[index] = color
        this.trackManager.updatePitchPaletteConfig(track.id, {
          pitchPaletteIndex: index,
          pitchPaletteColor: color
        })
      })
    }, 0)

    return { folder: pitchPaletteFolder, data: pitchPaletteData, swatchContainer }
  }

  renderPitchPaletteSwatches (container, palette, onColorChange) {
    if (!container) return
    container.innerHTML = ''
    container.style.gridTemplateRows = `repeat(${Math.min(
      7,
      Math.max(1, palette.length)
    )}, auto)`

    palette.forEach((color, index) => {
      const hex = this.normalizeHexColor(color)
      const item = document.createElement('label')
      item.className = 'pitch-color-item'
      item.style.backgroundColor = hex
      item.title = `Color ${index + 1}`

      const label = document.createElement('span')
      label.textContent = String(index + 1)

      const input = document.createElement('input')
      input.type = 'color'
      input.value = hex
      input.setAttribute('aria-label', `Pitch color ${index + 1}`)
      input.addEventListener('input', (ev) => {
        const next = ev.target.value
        item.style.backgroundColor = next
        onColorChange?.(index, next)
      })

      item.appendChild(label)
      item.appendChild(input)
      container.appendChild(item)
    })
  }

  normalizeHexColor (color) {
    if (typeof color !== 'string') return '#ffffff'
    if (/^#[0-9a-fA-F]{6}$/.test(color)) return color
    if (/^#[0-9a-fA-F]{3}$/.test(color)) {
      return `#${color[1]}${color[1]}${color[2]}${color[2]}${color[3]}${color[3]}`
    }
    return '#ffffff'
  }

  triggerLuminodeConfigChange (trackId, luminode, param, value) {
    const event = new CustomEvent('luminodeConfigChange', {
      detail: {
        trackId,
        luminode,
        param,
        value
      }
    })
    this.panel.dispatchEvent(event)
  }

  getLuminodeSettingsKey (luminode) {
    return getLuminodeSettingsKeyFromRegistry(luminode)
  }

  updateTrackUI (trackId, track) {
    const paneData = this.trackPanes.get(trackId)
    if (!paneData || !paneData.trackHeaderContainer) return

    const muteBtn = paneData.trackHeaderContainer.querySelector('.mute-btn')
    const soloBtn = paneData.trackHeaderContainer.querySelector('.solo-btn')

    if (muteBtn) muteBtn.classList.toggle('active', track.muted)
    if (soloBtn) soloBtn.classList.toggle('active', track.solo)

    paneData.trackData.midiDevice = track.midiDevice || ''
    paneData.trackData.luminode = track.luminode || ''
    this.updateLuminodeButtonTitle(trackId, track.luminode)

    if (track.luminode !== 'triangle' && paneData.layoutData) {
      paneData.layoutData.position = { x: track.layout.x, y: track.layout.y }
      paneData.layoutData.rotation = track.layout.rotation
    }

    // Dispose stale luminode bindings before refresh so tweakpane does not
    // emit change events against a luminode that was already cleared.
    this.updateLuminodeConfigPane(trackId, track.luminode)
    this.updatePitchPalettePane(trackId, track.luminode)

    try {
      paneData.pane.refresh()
    } catch (_) {}
  }

  updatePitchPalettePane (trackId, luminode) {
    const paneData = this.trackPanes.get(trackId)
    if (!paneData || !paneData.pane) return

    if (paneData.pitchPaletteFolder) {
      try {
        paneData.pitchPaletteFolder.dispose()
      } catch (e) {
        console.warn('Error disposing pitch palette folder:', e)
      }
      paneData.pitchPaletteFolder = null
      paneData.pitchPaletteData = null
      paneData.pitchSwatchContainer = null
    }

    if (luminode) {
      const track = this.trackManager.getTrack(trackId)
      if (track) {
        try {
          const created = this.createPitchPaletteFolder(paneData.pane, track)
          paneData.pitchPaletteFolder = created?.folder || null
          paneData.pitchPaletteData = created?.data || null
          paneData.pitchSwatchContainer = created?.swatchContainer || null
          paneData.pane.refresh()
        } catch (e) {
          console.error('Error creating pitch palette folder:', e)
        }
      }
    }
  }

  updateLuminodeConfigPane (trackId, luminode) {
    const paneData = this.trackPanes.get(trackId)
    if (!paneData || !paneData.pane) {
      console.warn(`Pane data not found for track ${trackId}`)
      return
    }

    if (paneData.luminodeFolder) {
      try {
        paneData.luminodeFolder.dispose()
      } catch (e) {
        console.warn('Error disposing luminode folder:', e)
      }
      paneData.luminodeFolder = null
    }

    if (luminode && hasLuminodeConfig(luminode)) {
      const track = this.trackManager.getTrack(trackId)
      if (track) {
        const updatedTrack = { ...track, luminode }
        try {
          paneData.luminodeFolder = this.createLuminodeConfigFolder(
            paneData.pane,
            updatedTrack
          )
          if (paneData.luminodeFolder) {
            paneData.pane.refresh()
          }
        } catch (e) {
          console.error('Error creating luminode config folder:', e)
        }
      } else {
        console.warn(
          `Track ${trackId} not found when updating luminode config`
        )
      }
    }
  }

  updateTrajectoryUI (trackId, config) {
    const paneData = this.trackPanes.get(trackId)
    if (!paneData || !paneData.trajectoryData) return

    Object.assign(paneData.trajectoryData, {
      enabled: config.enabled,
      trajectoryType: config.trajectoryType,
      motionRate: config.motionRate,
      amplitude: config.amplitude,
      ratioA: config.ratioA,
      ratioB: config.ratioB,
      ratioC: config.ratioC,
      inversion: config.inversion
    })
  }

  updateMidiDeviceDropdowns () {
    this.trackPanes.forEach((paneData, trackId) => {
      if (!paneData || !paneData.midiBinding) return

      const midiDevices = this.trackManager.getAvailableMidiDevices()
      const midiDeviceOptions = { 'Select Device': '' }
      midiDevices.forEach((device) => {
        midiDeviceOptions[device.name] = device.id
      })

      try {
        const binding = paneData.midiBinding
        if (binding.controller && binding.controller.valueController) {
          const valueController = binding.controller.valueController
          if (valueController.props) {
            valueController.props.set('options', midiDeviceOptions)
            const currentDeviceId = paneData.trackData.midiDevice
            const deviceName = Object.keys(midiDeviceOptions).find(
              (k) => midiDeviceOptions[k] === currentDeviceId
            )
            if (currentDeviceId && !deviceName) {
              paneData.trackData.midiDevice = ''
              this.trackManager.setMidiDevice(trackId, null)
            }
          }
        }
      } catch (error) {
        // Swallow — calling renderTracks() here causes an infinite loop
        // because forEach visits new Map entries added during iteration.
      }
    })
  }

  updateActivityIndicators (activeNotes) {
    const tracks = this.trackManager.getTracks()

    tracks.forEach((track) => {
      const paneData = this.trackPanes.get(track.id)
      if (paneData && paneData.trackHeaderContainer) {
        const indicator = paneData.trackHeaderContainer.querySelector(
          `#activity-${track.id}`
        )
        if (indicator) {
          const hasActivity =
            track.luminode &&
            ((activeNotes[track.id] && activeNotes[track.id].length > 0) ||
              (activeNotes[track.luminode] &&
                activeNotes[track.luminode].length > 0))
          indicator.classList.toggle('active', hasActivity)
        }
      }
    })
  }

  getTrackColor (trackId) {
    const colors = ['#EF4136', '#005BBB', '#fca309', '#2E7D32']
    return colors[(trackId - 1) % colors.length]
  }

  normalizeLuminodeName (name) {
    return getLuminodeDisplayName(name)
  }

  updateLineModulationUI (trackId, config) {
    const paneData = this.trackPanes.get(trackId)
    if (!paneData || !paneData.lineModulationData || !config) return

    Object.assign(paneData.lineModulationData, {
      enabled: config.enabled,
      oscAmount: config.oscillation?.amount,
      oscFrequency: config.oscillation?.frequency,
      oscSpeed: config.oscillation?.speed,
      oscPhase: config.oscillation?.phase,
      oscWave: config.oscillation?.wave || 'sine',
      noiseAmount: config.noise?.amount,
      noiseScale: config.noise?.scale,
      noiseSpeed: config.noise?.speed
    })
  }

  getLineModulationConfig (trackId) {
    return this.trackManager.getLineModulationConfig(trackId)
  }

  getTrajectoryConfig (trackId) {
    return this.trackManager.getTrajectoryConfig(trackId)
  }
}
