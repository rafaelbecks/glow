// UI controls and event listeners
export class UIManager {
  constructor () {
    this.elements = {}
    this.callbacks = {}
    this.isSetModeActive = false
    this.setSceneCount = 0
    this.initializeElements()
    this.setupEventListeners()
  }

  setSetModeActive (active, sceneCount = 0) {
    this.isSetModeActive = active
    this.setSceneCount = active ? sceneCount : 0
  }

  isTextInputTarget (target) {
    if (!target) return false
    const tag = target.tagName
    return (
      tag === 'INPUT' ||
      tag === 'TEXTAREA' ||
      tag === 'SELECT' ||
      target.isContentEditable
    )
  }

  isDialogOpen () {
    return Boolean(
      document.querySelector(
        '.save-dialog.show, .create-set-dialog.show, .file-picker-dialog.show, .info-modal.show, .glow-confirm-dialog.show'
      )
    )
  }

  isStartScreenVisible () {
    const logo = this.elements.logoContainer
    if (!logo) return false
    return logo.style.display !== 'none'
  }

  initializeElements () {
    this.elements = {
      startButton: document.getElementById('startButton'),
      appMenuMount: document.getElementById('appMenuMount'),
      panelToggleButton: document.getElementById('panelToggleButton'),
      infoModal: document.getElementById('infoModal'),
      infoModalClose: document.getElementById('infoModalClose'),
      infoModalBody: document.getElementById('infoModalBody'),
      aboutModal: document.getElementById('aboutModal'),
      aboutModalClose: document.getElementById('aboutModalClose'),
      aboutModalMeta: document.getElementById('aboutModalMeta'),
      canvasMessage: document.getElementById('canvasMessage'),
      canvasWizardAddLuminode: document.getElementById('canvasWizardAddLuminode'),
      quickStartMidiModal: document.getElementById('quickStartMidiModal'),
      quickStartMidiClose: document.getElementById('quickStartMidiClose'),
      quickStartMidiSelect: document.getElementById('quickStartMidiSelect'),
      quickStartMidiConnect: document.getElementById('quickStartMidiConnect'),
      quickStartMidiGenerator: document.getElementById('quickStartMidiGenerator'),
      readTabletData: document.getElementById('readTabletData'),
      clearTablet: document.getElementById('clearTablet'),
      tabletWidth: document.getElementById('tabletWidth'),
      colorToggle: document.getElementById('colorToggle'),
      logoContainer: document.getElementById('logoContainer'),
      projectNameDisplay: document.getElementById('projectNameDisplay'),
      projectAudioTransportBtn: document.getElementById(
        'projectAudioTransportBtn'
      )
    }

    this.appMenu = null
    this.detachActive = false
    this.mixerActive = false
    this.statusVisible = false
    this.sidePanelVisible = false
    this.iconsVisible = true
    this.audioTransportAvailable = false
    this.audioTransportPlaying = false
  }

  setAppMenu (menu) {
    this.appMenu = menu
  }

  refreshAppMenu () {
    this.appMenu?.refresh?.()
  }

  setupEventListeners () {
    if (this.elements.startButton) {
      this.elements.startButton.addEventListener('click', () => {
        this.triggerCallback('startVisualizer')
      })
    }

    if (this.elements.panelToggleButton) {
      this.elements.panelToggleButton.addEventListener('click', () => {
        this.triggerCallback('togglePanel')
      })
    }

    if (this.elements.projectAudioTransportBtn) {
      this.elements.projectAudioTransportBtn.addEventListener('click', (e) => {
        e.preventDefault()
        e.stopPropagation()
        this.triggerCallback('toggleAudioTransport')
      })
    }

    if (this.elements.infoModalClose) {
      this.elements.infoModalClose.addEventListener('click', () => {
        this.hideInfoModal()
      })
    }

    if (this.elements.infoModal) {
      this.elements.infoModal.addEventListener('click', (e) => {
        if (e.target === this.elements.infoModal) {
          this.hideInfoModal()
        }
      })
    }

    if (this.elements.aboutModalClose) {
      this.elements.aboutModalClose.addEventListener('click', () => {
        this.hideAboutModal()
      })
    }

    if (this.elements.aboutModal) {
      this.elements.aboutModal.addEventListener('click', (e) => {
        if (e.target === this.elements.aboutModal) {
          this.hideAboutModal()
        }
      })
    }

    if (this.elements.canvasWizardAddLuminode) {
      this.elements.canvasWizardAddLuminode.addEventListener('click', () => {
        this.triggerCallback('wizardAddLuminode')
      })
    }

    if (this.elements.quickStartMidiClose) {
      this.elements.quickStartMidiClose.addEventListener('click', () => {
        this.hideQuickStartMidiModal()
      })
    }

    if (this.elements.quickStartMidiModal) {
      this.elements.quickStartMidiModal.addEventListener('click', (e) => {
        if (e.target === this.elements.quickStartMidiModal) {
          this.hideQuickStartMidiModal()
        }
      })
    }

    if (this.elements.quickStartMidiConnect) {
      this.elements.quickStartMidiConnect.addEventListener('click', () => {
        const deviceId = this.elements.quickStartMidiSelect?.value || ''
        if (!deviceId) return
        this.triggerCallback('wizardAssignMidiDevice', { trackId: 1, deviceId })
        this.hideQuickStartMidiModal()
      })
    }

    if (this.elements.quickStartMidiGenerator) {
      this.elements.quickStartMidiGenerator.addEventListener('click', () => {
        this.triggerCallback('wizardUseGenerator', { trackId: 1 })
        this.hideQuickStartMidiModal()
      })
    }

    if (this.elements.readTabletData) {
      this.elements.readTabletData.addEventListener('click', () => {
        this.triggerCallback('connectTablet')
      })
    }

    if (this.elements.clearTablet) {
      this.elements.clearTablet.addEventListener('click', () => {
        this.triggerCallback('clearTablet')
      })
    }

    if (this.elements.tabletWidth) {
      this.elements.tabletWidth.addEventListener('input', (e) => {
        this.triggerCallback('tabletWidthChange', parseInt(e.target.value))
      })
    }

    // Keyboard shortcuts (capture phase so set scene keys work over Tweakpane)
    window.addEventListener(
      'keydown',
      (e) => {
        const mod = e.metaKey || e.ctrlKey
        if (mod && this.isTextInputTarget(e.target)) return

        if (mod && e.key.toLowerCase() === 'u') {
          e.preventDefault()
          this.triggerCallback('clearCanvas')
        } else if (mod && e.key.toLowerCase() === 'i') {
          e.preventDefault()
          this.toggleIcons()
        } else if (mod && e.key.toLowerCase() === 'n') {
          e.preventDefault()
          this.triggerCallback('newFile')
        } else if (mod && e.key.toLowerCase() === 'o') {
          e.preventDefault()
          this.triggerCallback('openFile')
        } else if (mod && e.shiftKey && e.key.toLowerCase() === 's') {
          e.preventDefault()
          this.triggerCallback('saveFileAs')
        } else if (mod && e.key.toLowerCase() === 's') {
          e.preventDefault()
          this.triggerCallback('saveFile')
        } else if (mod && e.key.toLowerCase() === 'm') {
          e.preventDefault()
          this.triggerCallback('enableHardwareMode')
        } else if (mod && e.key.toLowerCase() === 'p') {
          e.preventDefault()
          this.triggerCallback('exportSnapshotHotkey')
        } else if (
          this.isStartScreenVisible() &&
          e.code === 'Space' &&
          !e.metaKey &&
          !e.ctrlKey &&
          !e.altKey &&
          !this.isTextInputTarget(e.target) &&
          !this.isDialogOpen()
        ) {
          e.preventDefault()
          this.triggerCallback('startVisualizer')
        } else if (
          this.audioTransportAvailable &&
          e.code === 'Space' &&
          !e.metaKey &&
          !e.ctrlKey &&
          !e.altKey &&
          !this.isTextInputTarget(e.target) &&
          !this.isDialogOpen()
        ) {
          e.preventDefault()
          this.triggerCallback('toggleAudioTransport')
        } else if (
          this.isSetModeActive &&
          !e.metaKey &&
          !e.ctrlKey &&
          !e.altKey &&
          !e.shiftKey &&
          !this.isTextInputTarget(e.target) &&
          !this.isDialogOpen()
        ) {
          const digit = parseInt(e.key, 10)
          if (digit >= 1 && digit <= this.setSceneCount) {
            e.preventDefault()
            e.stopPropagation()
            this.triggerCallback('switchSetScene', digit - 1)
          }
        }
      },
      true
    )

    window.addEventListener('resize', () => {
      this.triggerCallback('resize')
    })
  }

  // Callback system for UI events
  on (event, callback) {
    if (!this.callbacks[event]) {
      this.callbacks[event] = []
    }
    this.callbacks[event].push(callback)
  }

  triggerCallback (event, data) {
    if (this.callbacks[event]) {
      this.callbacks[event].forEach((callback) => callback(data))
    }
  }

  // UI state management
  hideStartButton () {
    if (this.elements.startButton) {
      this.elements.startButton.style.display = 'none'
    }
  }

  showStartButton () {
    if (this.elements.startButton) {
      this.elements.startButton.style.display = 'block'
    }
  }

  // Get current UI state
  getColorMode () {
    return this.elements.colorToggle
      ? this.elements.colorToggle.checked
      : false
  }

  getTabletWidth () {
    return this.elements.tabletWidth
      ? parseInt(this.elements.tabletWidth.value)
      : 4
  }

  // Update UI elements
  updateTabletWidth (value) {
    if (this.elements.tabletWidth) {
      this.elements.tabletWidth.value = value
    }
  }

  // Add status indicator
  showStatus (message, type = 'info') {
    console.log('[UI DEBUG]:', message, type)
    // Status messages disabled
    return

    // Create or update status element
    let statusEl = document.getElementById('status')
    if (!statusEl) {
      statusEl = document.createElement('div')
      statusEl.id = 'status'
      statusEl.style.cssText = `
        position: absolute;
        top: 10px;
        right: 10px;
        color: white;
        background: rgba(0,0,0,0.7);
        padding: 10px;
        border-radius: 5px;
        z-index: 100;
        font-family: monospace;
      `
      document.body.appendChild(statusEl)
    }

    statusEl.textContent = message
    statusEl.style.color =
      type === 'error' ? '#ff6b6b' : type === 'success' ? '#51cf66' : 'white'
  }

  hideStatus () {
    const statusEl = document.getElementById('status')
    if (statusEl) {
      statusEl.remove()
    }
    this.statusVisible = false
  }

  showLogoContainer () {
    if (this.elements.logoContainer) {
      this.elements.logoContainer.style.display = 'flex'
    }
  }

  hideLogoContainer () {
    if (this.elements.logoContainer) {
      this.elements.logoContainer.style.display = 'none'
    }
  }

  showAppMenu () {
    this.appMenu?.show?.()
  }

  hideAppMenu () {
    this.appMenu?.hide?.()
  }

  /** @deprecated Icons moved to app menu — kept as no-ops for callers */
  showDetachButton () {}
  hideDetachButton () {}
  showOpenButton () {}
  hideOpenButton () {}
  showSaveButton () {}
  hideSaveButton () {}
  showLabButton () {}
  hideLabButton () {}
  showMixerButton () {}
  hideMixerButton () {}
  showInfoButton () {}
  hideInfoButton () {}

  showPanelToggleButton () {
    if (this.elements.panelToggleButton) {
      this.elements.panelToggleButton.style.display = 'flex'
    }
  }

  hidePanelToggleButton () {
    if (this.elements.panelToggleButton) {
      this.elements.panelToggleButton.style.display = 'none'
    }
  }

  setDetachActive (active) {
    this.detachActive = Boolean(active)
    this.refreshAppMenu()
    this.triggerCallback('toolsShortcutSync')
  }

  isDetachActive () {
    return this.detachActive
  }

  setPanelToggleActive (_active) {
    this.refreshAppMenu()
    this.triggerCallback('toolsShortcutSync')
  }

  setMixerToggleActive (active) {
    this.mixerActive = Boolean(active)
    this.refreshAppMenu()
  }

  isMixerActive () {
    return this.mixerActive
  }

  isUiChromeVisible () {
    return this.iconsVisible
  }

  async showInfoModal () {
    if (this.elements.infoModal && this.elements.infoModalBody) {
      // Load and parse the markdown content
      try {
        const response = await fetch('../USER_MANUAL.md')
        const markdownContent = await response.text()

        // Use marked to convert markdown to HTML
        if (typeof marked !== 'undefined') {
          const htmlContent = marked.parse(markdownContent)
          this.elements.infoModalBody.innerHTML = htmlContent
        } else {
          // Fallback if marked is not loaded
          this.elements.infoModalBody.innerHTML =
            '<p>Error loading content. Please refresh the page.</p>'
        }
      } catch (error) {
        console.error('Error loading user manual:', error)
        this.elements.infoModalBody.innerHTML =
          '<p>Error loading content. Please check if USER_MANUAL.md exists.</p>'
      }

      this.elements.infoModal.classList.add('show')
    }
  }

  hideInfoModal () {
    if (this.elements.infoModal) {
      this.elements.infoModal.classList.remove('show')
    }
  }

  showAboutModal ({ version = '1.0.0' } = {}) {
    if (!this.elements.aboutModal) return
    if (this.elements.aboutModalMeta) {
      const year = new Date().getFullYear()
      this.elements.aboutModalMeta.textContent = `v${version} · ${year}`
    }
    this.elements.aboutModal.classList.add('show')
  }

  hideAboutModal () {
    if (this.elements.aboutModal) {
      this.elements.aboutModal.classList.remove('show')
    }
  }

  showQuickStartMidiModal (devices = []) {
    const modal = this.elements.quickStartMidiModal
    const select = this.elements.quickStartMidiSelect
    const connectBtn = this.elements.quickStartMidiConnect
    if (!modal || !select || !connectBtn) return

    select.innerHTML = ''
    const placeholder = document.createElement('option')
    placeholder.value = ''
    placeholder.textContent = devices.length ? 'Select device' : 'No MIDI devices found'
    select.appendChild(placeholder)

    devices.forEach((device) => {
      const option = document.createElement('option')
      option.value = device.id
      option.textContent = device.name
      select.appendChild(option)
    })

    select.disabled = devices.length === 0
    connectBtn.disabled = devices.length === 0
    modal.classList.add('show')
  }

  hideQuickStartMidiModal () {
    if (this.elements.quickStartMidiModal) {
      this.elements.quickStartMidiModal.classList.remove('show')
    }
  }

  showCanvasMessage () {
    if (this.elements.canvasMessage) {
      this.elements.canvasMessage.style.display = 'flex'
    }
  }

  hideCanvasMessage () {
    if (this.elements.canvasMessage) {
      this.elements.canvasMessage.style.display = 'none'
    }
  }

  // Canvas resizing methods
  setSidePanelVisible (visible) {
    this.sidePanelVisible = visible
    this.updateCanvasSize()
    this.refreshAppMenu()
  }

  isSidePanelVisible () {
    return this.sidePanelVisible
  }

  updateCanvasSize () {
    const body = document.body
    body.classList.remove('side-panel-visible')

    if (this.sidePanelVisible) {
      body.classList.add('side-panel-visible')
    }
  }

  // Chrome visibility (menu + project name)
  toggleIcons () {
    this.iconsVisible = !this.iconsVisible
    if (this.iconsVisible) {
      this.showAllIcons()
    } else {
      this.hideAllIcons()
    }
    this.triggerCallback('iconsVisibilityChange', { visible: this.iconsVisible })
  }

  showAllIcons () {
    this.showAppMenu()
    this.showProjectNameDisplay()
    this.refreshAppMenu()
    this.triggerCallback('toolsShortcutSync')
  }

  hideAllIcons () {
    this.hideAppMenu()
    this.hideProjectNameDisplay()
    this.hidePanelToggleButton()
  }

  showProjectNameDisplay () {
    if (this.elements.projectNameDisplay) {
      this.elements.projectNameDisplay.style.display = 'flex'
    }
  }

  hideProjectNameDisplay () {
    if (this.elements.projectNameDisplay) {
      this.elements.projectNameDisplay.style.display = 'none'
    }
  }

  setAudioTransportAvailable (available) {
    this.audioTransportAvailable = Boolean(available)
    const btn = this.elements.projectAudioTransportBtn
    if (!btn) return
    if (this.audioTransportAvailable) {
      btn.classList.add('is-visible')
      btn.style.display = 'flex'
    } else {
      btn.classList.remove('is-visible')
      btn.style.display = 'none'
      this.setAudioTransportPlaying(false)
    }
  }

  setAudioTransportPlaying (playing) {
    this.audioTransportPlaying = Boolean(playing)
    const btn = this.elements.projectAudioTransportBtn
    if (!btn) return
    const icon = btn.querySelector('ion-icon')
    btn.classList.toggle('is-playing', this.audioTransportPlaying)
    btn.setAttribute(
      'aria-label',
      this.audioTransportPlaying ? 'Stop audio' : 'Play audio'
    )
    btn.title = this.audioTransportPlaying
      ? 'Stop audio (Space)'
      : 'Play audio (Space)'
    if (icon) {
      icon.setAttribute(
        'name',
        this.audioTransportPlaying ? 'stop' : 'play'
      )
    }
  }
}
