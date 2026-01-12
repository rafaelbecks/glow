import { Pane } from '../lib/tweakpane.min.js'
import { hasLuminodeConfig, getLuminodesByGroup, getLuminodeConfig } from '../luminode-configs.js'
import { getLuminodeDisplayName, getLuminodeSettingsKey as getLuminodeSettingsKeyFromRegistry } from '../luminodes/index.js'

export { getLuminodeDisplayName as normalizeLuminodeName }

export class TrackUIManager {
  constructor (trackManager, panel, luminodeConfigManager = null) {
    this.trackManager = trackManager
    this.panel = panel
    this.luminodeConfigManager = luminodeConfigManager
    this.settings = null
    this.trackPanes = new Map()
    this.mainPane = null
  }

  setSettings (settings) {
    this.settings = settings
  }

  renderTracks () {
    const tracksContainer = this.panel.querySelector('#tracksContainer')
    const tracks = this.trackManager.getTracks()

    if (this.mainPane) {
      this.mainPane.dispose()
      this.mainPane = null
    }
    this.trackPanes.clear()

    tracksContainer.innerHTML = `<div id="track-pane-container"></div>`

    const paneContainer = tracksContainer.querySelector('#track-pane-container')
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

    const tabs = this.mainPane.addTab({
      pages: tracks.map(track => ({ title: `Track ${track.id}` }))
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
        const paneElement = pane.element || pane.element_ || (pane.controller && pane.controller.view && pane.controller.view.element)
        if (paneElement) {
          const tabContent = paneElement.querySelector('.tp-tabv_c') || paneElement.querySelector('.tp-rotv') || paneElement
          if (tabContent && tabContent.firstChild) {
            tabContent.insertBefore(trackHeaderContainer, tabContent.firstChild)
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
      midiDevices.forEach(device => {
        midiDeviceOptions[device.name] = device.id
      })

      const groupedLuminodes = this.getGroupedLuminodeOptions()

      const trackData = {
        midiDevice: track.midiDevice || '',
        luminode: track.luminode || ''
      }

      const midiBinding = pane.addBinding(trackData, 'midiDevice', {
        options: midiDeviceOptions,
        label: 'MIDI Device'
      }).on('change', (ev) => {
        this.trackManager.setMidiDevice(track.id, ev.value || null)
      })

      const luminodeBinding = pane.addBinding(trackData, 'luminode', {
        options: groupedLuminodes,
        label: 'Luminode'
      }).on('change', (ev) => {
        const newLuminode = ev.value || null
        this.trackManager.setLuminode(track.id, newLuminode)
        trackData.luminode = newLuminode || ''
        this.updateLuminodeConfigPane(track.id, newLuminode)
      })

    let layoutData = null
    let trajectoryData = null

    if (track.luminode !== 'triangle') {
      layoutData = {
        position: { x: track.layout.x, y: track.layout.y },
        rotation: track.layout.rotation
      }

      const layoutFolder = pane.addFolder({ title: 'Layout', expanded: true })
      const positionBinding = layoutFolder.addBinding(layoutData, 'position', {
        label: 'Position',
        picker: 'inline',
        expanded: true,
        x: { min: -500, max: 500, step: 10 },
        y: { min: -500, max: 500, step: 10 }
      }).on('change', (ev) => {
        this.trackManager.setLayout(track.id, { x: ev.value.x, y: ev.value.y })
      })

      setTimeout(() => {
        const positionElement = positionBinding.element
        if (positionElement) {
          const textContainer = positionElement.querySelector('.tp-pndtxtv')
          if (textContainer) {
            const inputs = textContainer.querySelectorAll('.tp-pndtxtv_a input')
            if (inputs.length >= 2) {
              const xInput = inputs[0]
              const yInput = inputs[1]
              if (xInput && !xInput.parentElement.querySelector('.axis-label-x')) {
                const xLabel = document.createElement('span')
                xLabel.className = 'axis-label axis-label-x'
                xLabel.textContent = 'X:'
                xInput.parentElement.insertBefore(xLabel, xInput)
              }
              if (yInput && !yInput.parentElement.querySelector('.axis-label-y')) {
                const yLabel = document.createElement('span')
                yLabel.className = 'axis-label axis-label-y'
                yLabel.textContent = 'Y:'
                yInput.parentElement.insertBefore(yLabel, yInput)
              }
            }
          }
        }
      }, 150)

      layoutFolder.addBinding(layoutData, 'rotation', {
        label: 'R',
        min: -180,
        max: 180,
        step: 5
      }).on('change', (ev) => {
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

      const trajectoryFolder = pane.addFolder({ title: 'Trajectory Motion', expanded: true })
      trajectoryFolder.addBinding(trajectoryData, 'enabled', {
        label: 'Enable Motion'
      }).on('change', (ev) => {
        this.trackManager.updateTrajectoryConfig(track.id, { enabled: ev.value })
      })

      trajectoryFolder.addBinding(trajectoryData, 'trajectoryType', {
        options: typeOptions,
        label: 'Type'
      }).on('change', (ev) => {
        this.trackManager.updateTrajectoryConfig(track.id, { trajectoryType: ev.value })
      })

      trajectoryFolder.addBinding(trajectoryData, 'motionRate', {
        label: 'Rate',
        min: 0.01,
        max: 2.0,
        step: 0.01
      }).on('change', (ev) => {
        this.trackManager.updateTrajectoryConfig(track.id, { motionRate: ev.value })
      })

      trajectoryFolder.addBinding(trajectoryData, 'amplitude', {
        label: 'Amplitude',
        min: 0,
        max: 200,
        step: 1
      }).on('change', (ev) => {
        this.trackManager.updateTrajectoryConfig(track.id, { amplitude: ev.value })
      })

      trajectoryFolder.addBinding(trajectoryData, 'ratioA', {
        label: 'Ratio A',
        min: 0.1,
        max: 5.0,
        step: 0.1
      }).on('change', (ev) => {
        this.trackManager.updateTrajectoryConfig(track.id, { ratioA: ev.value })
      })

      trajectoryFolder.addBinding(trajectoryData, 'ratioB', {
        label: 'Ratio B',
        min: 0.1,
        max: 5.0,
        step: 0.1
      }).on('change', (ev) => {
        this.trackManager.updateTrajectoryConfig(track.id, { ratioB: ev.value })
      })

      trajectoryFolder.addBinding(trajectoryData, 'ratioC', {
        label: 'Ratio C',
        min: 0.1,
        max: 5.0,
        step: 0.1
      }).on('change', (ev) => {
        this.trackManager.updateTrajectoryConfig(track.id, { ratioC: ev.value })
      })

      trajectoryFolder.addBinding(trajectoryData, 'inversion', {
        label: 'Invert Motion'
      }).on('change', (ev) => {
        this.trackManager.updateTrajectoryConfig(track.id, { inversion: ev.value })
      })
    }

    let luminodeFolder = null
    if (track.luminode && hasLuminodeConfig(track.luminode)) {
      luminodeFolder = this.createLuminodeConfigFolder(pane, track)
    }

    this.trackPanes.set(track.id, {
      pane,
      trackData,
      layoutData,
      trajectoryData,
      luminodeFolder,
      midiBinding,
      luminodeBinding,
      trackHeaderContainer
    })
    } catch (error) {
      console.error(`Failed to create track pane for track ${track.id}:`, error)
    }
  }

  getGroupedLuminodeOptions () {
    const groupedLuminodes = getLuminodesByGroup()
    const options = { 'Select Luminode': '' }

    Object.entries(groupedLuminodes).forEach(([groupName, luminodes]) => {
      luminodes.forEach(luminode => {
        const displayName = `${this.normalizeLuminodeName(luminode)} (${groupName})`
        options[displayName] = luminode
      })
    })

    return options
  }

  createLuminodeConfigFolder (pane, track) {
    const configParams = getLuminodeConfig(track.luminode)
    if (!configParams || configParams.length === 0) return null

    let currentValues = {}
    if (this.settings) {
      const settingsModule = this.settings.MODULES || this.settings
      const luminodeKey = this.getLuminodeSettingsKey(track.luminode)
      if (settingsModule[luminodeKey]) {
        currentValues = settingsModule[luminodeKey]
      }
    }

    const luminodeData = {}
    configParams.forEach(param => {
      luminodeData[param.key] = currentValues[param.key] !== undefined 
        ? currentValues[param.key] 
        : param.default
    })

    const luminodeFolder = pane.addFolder({ title: 'Luminode Parameters', expanded: true })

    configParams.forEach(param => {
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
          options.map(opt => [opt.label, opt.value])
        )
      }

      luminodeFolder.addBinding(luminodeData, param.key, bindingOptions)
        .on('change', (ev) => {
          this.triggerLuminodeConfigChange(track.id, track.luminode, param.key, ev.value)
        })
    })

    return luminodeFolder
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
    
    if (track.luminode !== 'triangle' && paneData.layoutData) {
      paneData.layoutData.position = { x: track.layout.x, y: track.layout.y }
      paneData.layoutData.rotation = track.layout.rotation
    }

    this.updateLuminodeConfigPane(trackId, track.luminode)
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
          paneData.luminodeFolder = this.createLuminodeConfigFolder(paneData.pane, updatedTrack)
          if (paneData.luminodeFolder) {
            paneData.pane.refresh()
          }
        } catch (e) {
          console.error('Error creating luminode config folder:', e)
        }
      } else {
        console.warn(`Track ${trackId} not found when updating luminode config`)
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
      midiDevices.forEach(device => {
        midiDeviceOptions[device.name] = device.id
      })

      try {
        const binding = paneData.midiBinding
        if (binding.controller && binding.controller.valueController) {
          const valueController = binding.controller.valueController
          if (valueController.props) {
            valueController.props.set('options', midiDeviceOptions)
            const currentDeviceId = paneData.trackData.midiDevice
            const deviceName = Object.keys(midiDeviceOptions).find(k => midiDeviceOptions[k] === currentDeviceId)
            if (currentDeviceId && !deviceName) {
              paneData.trackData.midiDevice = ''
              this.trackManager.setMidiDevice(trackId, null)
            }
          }
        }
      } catch (error) {
        console.warn(`Failed to update MIDI device dropdown for track ${trackId}:`, error)
        this.renderTracks()
      }
    })
  }

  updateActivityIndicators (activeNotes) {
    const tracks = this.trackManager.getTracks()

    tracks.forEach(track => {
      const paneData = this.trackPanes.get(track.id)
      if (paneData && paneData.trackHeaderContainer) {
        const indicator = paneData.trackHeaderContainer.querySelector(`#activity-${track.id}`)
        if (indicator) {
          const hasActivity = track.luminode && activeNotes[track.luminode] && activeNotes[track.luminode].length > 0
          indicator.classList.toggle('active', hasActivity)
        }
      }
    })
  }

  getTrackColor (trackId) {
    const colors = [
      '#EF4136',
      '#005BBB',
      '#fca309',
      '#2E7D32'
    ]
    return colors[(trackId - 1) % colors.length]
  }

  normalizeLuminodeName (name) {
    return getLuminodeDisplayName(name)
  }

  getTrajectoryConfig (trackId) {
    return this.trackManager.getTrajectoryConfig(trackId)
  }
}
