/**
 * Luminode Center — editor + live preview for creating, editing, and forking luminodes.
 */
import {
  createUserLuminode,
  getBuiltinSourceUrl,
  isUserLuminodeId,
  generateUserId
} from './model.js'
import { LUMINODE_TEMPLATE, TEMPLATE_DISPLAY_NAME } from './template.js'
import {
  loadBuiltinSource,
  compileLuminodeSource
} from './runtime.js'
import {
  upsertUserLuminode,
  getUserLuminode,
  downloadLuminodeFile,
  parseLuminodeFile
} from './storage.js'
import { registerUserLuminode } from './registry.js'
import { LuminodePreview, createPreviewNoteProvider } from './preview.js'
import { MidiGeneratorPane } from './midi-generator-pane.js'
import { LuminodeSettingsPane } from './settings-pane.js'
import { UTILS_REFERENCE_HTML } from './utils-reference.js'
import {
  deepClone,
  loadBuiltinModuleBundle,
  rewriteModuleAccess,
  DEFAULT_MODULE_SETTINGS,
  DEFAULT_CONFIG_SCHEMA,
  inferConfigSchema
} from './settings-helpers.js'
import {
  getLuminodeDisplayName,
  getAvailableLuminodes,
  getLuminodeSettingsKey
} from '../luminodes/index.js'

const PREVIEW_DEBOUNCE_MS = 350
const PREVIEW_MIN = 280
const EDITOR_MIN = 320
const PREVIEW_DEFAULT = 420

export class LuminodeCenter {
  /**
   * @param {object} hooks - { visualizer, trackManager, midiManager, midiGenerator, onSaved }
   */
  constructor (hooks = {}) {
    this.hooks = hooks
    this.dialog = document.getElementById('luminodeCenterDialog')
    this.editorHost = document.getElementById('luminodeCenterEditor')
    this.previewCanvas = document.getElementById('luminodeCenterPreviewCanvas')
    this.nameInput = document.getElementById('luminodeCenterName')
    this.errorEl = document.getElementById('luminodeCenterError')
    this.statusEl = document.getElementById('luminodeCenterStatus')
    this.sourceSelect = document.getElementById('luminodeCenterSource')
    this.contentEl = this.dialog
      ? this.dialog.querySelector('.luminode-center-dialog-content')
      : null
    this.bodyEl = this.dialog
      ? this.dialog.querySelector('.luminode-center-body')
      : null
    this.noteSourceEl = document.getElementById('luminodeCenterNoteSource')
    this.generatorHost = document.getElementById('luminodeCenterGeneratorHost')
    this.resizeHandle = document.getElementById('luminodeCenterResizeHandle')
    this.utilsHost = document.getElementById('luminodeCenterUtils')

    this.cm = null
    this.preview = null
    this.generatorPane = null
    this.settingsPane = null
    this.isVisible = false
    this.debounceTimer = null
    this.activeSideTab = 'preview'
    this.activeEditorTab = 'code'
    this.previewWidth = PREVIEW_DEFAULT
    this.resizing = false
    this.maximized = false

    // Editor session state
    this.docId = null
    this.originKey = null
    this.baselineSource = ''
    this.baselineModuleSettings = null
    this.baselineConfigSchema = null
    this.dirty = false
    this.builtinOnly = false
    this.moduleSettings = deepClone(DEFAULT_MODULE_SETTINGS)
    this.configSchema = deepClone(DEFAULT_CONFIG_SCHEMA)
  }

  setupEventListeners () {
    if (!this.dialog) return

    const closeBtn = document.getElementById('luminodeCenterClose')
    const cancelBtn = document.getElementById('luminodeCenterCancel')
    const maximizeBtn = document.getElementById('luminodeCenterMaximize')
    if (closeBtn) closeBtn.addEventListener('click', () => this.hide())
    if (cancelBtn) cancelBtn.addEventListener('click', () => this.hide())
    if (maximizeBtn) {
      maximizeBtn.addEventListener('click', () => {
        this.setMaximized(!this.maximized)
      })
    }

    this.dialog.addEventListener('click', (e) => {
      if (e.target === this.dialog) this.hide()
    })

    document.addEventListener('keydown', (e) => {
      if (!this.isVisible) return
      if (e.key === 'Escape') {
        if (this.maximized) {
          this.setMaximized(false)
          return
        }
        this.hide()
        return
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
        e.preventDefault()
        this.save()
      }
    })

    const bind = (id, fn) => {
      const el = document.getElementById(id)
      if (el) el.addEventListener('click', fn)
    }

    bind('luminodeCenterNew', () => this.newFromTemplate())
    bind('luminodeCenterSave', () => this.save())
    bind('luminodeCenterFork', () => this.fork())
    bind('luminodeCenterReset', () => this.reset())
    bind('luminodeCenterExport', () => this.exportFile())
    bind('luminodeCenterImport', () => this.importFile())

    this.dialog.querySelectorAll('.luminode-center-preview-tabs .luminode-center-tab').forEach((tab) => {
      tab.addEventListener('click', () => this.setSideTab(tab.dataset.tab))
    })

    this.dialog.querySelectorAll('.luminode-center-editor-tab').forEach((tab) => {
      tab.addEventListener('click', () => this.setEditorTab(tab.dataset.editorTab))
    })

    this.setupResize()

    if (this.nameInput) {
      this.nameInput.addEventListener('input', () => {
        this.dirty = true
        this.updateStatus()
      })
    }

    if (this.sourceSelect) {
      this.sourceSelect.addEventListener('change', () => {
        const key = this.sourceSelect.value
        if (key) this.open(key)
      })
    }

    const fileInput = document.getElementById('luminodeCenterFileInput')
    if (fileInput) {
      fileInput.addEventListener('change', async (e) => {
        const file = e.target.files?.[0]
        e.target.value = ''
        if (!file) return
        try {
          const text = await file.text()
          const doc = parseLuminodeFile(text)
          doc.id = generateUserId(doc.name)
          this.loadDocument(doc, { builtinOnly: false })
          this.setError(null)
          this.setStatus(`Imported “${doc.name}” — save to keep it`)
        } catch (err) {
          this.setError(err)
        }
      })
    }
  }

  setupResize () {
    if (!this.resizeHandle || !this.bodyEl) return

    const onMove = (e) => {
      if (!this.resizing) return
      const rect = this.bodyEl.getBoundingClientRect()
      const handleW = 6
      let previewW = rect.right - e.clientX - handleW / 2
      const max = rect.width - EDITOR_MIN - handleW
      previewW = Math.min(Math.max(previewW, PREVIEW_MIN), max)
      this.previewWidth = previewW
      this.applyPreviewWidth()
    }

    const onUp = () => {
      if (!this.resizing) return
      this.resizing = false
      this.resizeHandle.classList.remove('is-dragging')
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
      this.refreshEditors()
    }

    this.resizeHandle.addEventListener('mousedown', (e) => {
      e.preventDefault()
      this.resizing = true
      this.resizeHandle.classList.add('is-dragging')
      document.body.style.cursor = 'col-resize'
      document.body.style.userSelect = 'none'
    })

    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  setMaximized (enabled) {
    this.maximized = !!enabled
    if (this.contentEl) {
      this.contentEl.classList.toggle('is-maximized', this.maximized)
    }
    const btn = document.getElementById('luminodeCenterMaximize')
    if (btn) {
      const icon = btn.querySelector('ion-icon')
      if (icon) {
        icon.setAttribute(
          'name',
          this.maximized ? 'contract-outline' : 'expand-outline'
        )
      }
      btn.title = this.maximized ? 'Restore' : 'Maximize'
      btn.setAttribute('aria-label', btn.title)
    }
    this.refreshEditors()
  }

  applyPreviewWidth () {
    if (!this.bodyEl) return
    this.bodyEl.style.setProperty(
      '--luminode-preview-width',
      `${this.previewWidth}px`
    )
  }

  ensureEditor () {
    if (this.cm || !this.editorHost) return
    if (typeof window.CodeMirror === 'undefined') {
      console.warn('CodeMirror not loaded')
      const ta = document.createElement('textarea')
      ta.className = 'luminode-center-fallback-editor'
      ta.addEventListener('input', () => this.onSourceChanged())
      this.editorHost.appendChild(ta)
      this.cm = {
        getValue: () => ta.value,
        setValue: (v) => { ta.value = v },
        refresh: () => {},
        on: () => {}
      }
      return
    }

    this.cm = window.CodeMirror(this.editorHost, {
      value: '',
      mode: 'javascript',
      theme: 'material-darker',
      lineNumbers: true,
      lineWrapping: true,
      indentUnit: 2,
      tabSize: 2,
      autofocus: false
    })
    this.cm.on('change', () => this.onSourceChanged())
  }

  ensurePreview () {
    if (this.preview || !this.previewCanvas) return
    this.preview = new LuminodePreview(this.previewCanvas)
    this.preview.setCallbacks({
      onError: (err) => this.setError(err),
      onOk: () => this.setError(null),
      onNoteSourceChange: (source) => this.updateNoteSourceBadge(source)
    })
    this.preview.setNoteProvider(createPreviewNoteProvider(this.hooks))
    this.preview.initDrawer()
  }

  ensureSettingsPane () {
    if (this.settingsPane) return
    this.settingsPane = new LuminodeSettingsPane({
      jsonHost: document.getElementById('luminodeCenterSettingsJson'),
      tweakHost: document.getElementById('luminodeCenterSettingsTweak'),
      errorEl: document.getElementById('luminodeCenterSettingsError'),
      onChange: (values, schema) => {
        this.moduleSettings = values
        this.configSchema = schema
        this.dirty = true
        this.updateStatus()
        // MODULE is mutated in place — preview reads it every frame
      }
    })
  }

  ensureUtils () {
    if (!this.utilsHost || this.utilsHost.dataset.ready) return
    this.utilsHost.innerHTML = UTILS_REFERENCE_HTML
    this.utilsHost.dataset.ready = '1'
  }

  ensureGeneratorPane () {
    if (this.generatorPane || !this.hooks.midiGenerator) return
    this.generatorPane = new MidiGeneratorPane({
      midiGenerator: this.hooks.midiGenerator
    })
  }

  setEditorTab (tab) {
    const allowed = ['code', 'settings', 'utils']
    this.activeEditorTab = allowed.includes(tab) ? tab : 'code'

    this.dialog.querySelectorAll('.luminode-center-editor-tab').forEach((el) => {
      const active = el.dataset.editorTab === this.activeEditorTab
      el.classList.toggle('is-active', active)
      el.setAttribute('aria-selected', String(active))
    })
    this.dialog.querySelectorAll('.luminode-center-editor-panel').forEach((panel) => {
      const active = panel.dataset.editorPanel === this.activeEditorTab
      panel.classList.toggle('is-active', active)
      panel.hidden = !active
    })

    if (this.activeEditorTab === 'settings') {
      this.ensureSettingsPane()
      this.settingsPane.load(this.moduleSettings, this.configSchema)
    }
    if (this.activeEditorTab === 'utils') {
      this.ensureUtils()
    }
    this.refreshEditors()
  }

  setSideTab (tab) {
    this.activeSideTab = tab === 'generator' ? 'generator' : 'preview'
    this.dialog.querySelectorAll('.luminode-center-preview-tabs .luminode-center-tab').forEach((el) => {
      const active = el.dataset.tab === this.activeSideTab
      el.classList.toggle('is-active', active)
      el.setAttribute('aria-selected', String(active))
    })
    this.dialog.querySelectorAll('.luminode-center-tab-panel').forEach((panel) => {
      const active = panel.dataset.panel === this.activeSideTab
      panel.classList.toggle('is-active', active)
      panel.hidden = !active
    })

    if (this.activeSideTab === 'generator') {
      this.ensureGeneratorPane()
      if (this.generatorPane && this.generatorHost) {
        this.generatorPane.mount(this.generatorHost)
      }
    }
  }

  refreshEditors () {
    if (this.cm?.refresh) requestAnimationFrame(() => this.cm.refresh())
    if (this.settingsPane) this.settingsPane.refresh()
  }

  updateNoteSourceBadge (source) {
    if (!this.noteSourceEl) return
    const isMidi = source === 'midi'
    this.noteSourceEl.textContent = isMidi ? 'midi gen' : 'sample'
    this.noteSourceEl.classList.toggle('is-midi', isMidi)
  }

  populateSourceSelect (selectedKey = null) {
    if (!this.sourceSelect) return
    const builtins = getAvailableLuminodes().filter((k) => !isUserLuminodeId(k))
    const users = getAvailableLuminodes().filter((k) => isUserLuminodeId(k))

    this.sourceSelect.innerHTML = ''
    const addOpt = (value, label) => {
      const opt = document.createElement('option')
      opt.value = value
      opt.textContent = label
      this.sourceSelect.appendChild(opt)
    }

    addOpt('', '— Select luminode —')
    if (builtins.length) {
      const g = document.createElement('optgroup')
      g.label = 'Built-in'
      builtins.forEach((k) => {
        const opt = document.createElement('option')
        opt.value = k
        opt.textContent = getLuminodeDisplayName(k)
        g.appendChild(opt)
      })
      this.sourceSelect.appendChild(g)
    }
    if (users.length) {
      const g = document.createElement('optgroup')
      g.label = 'User'
      users.forEach((k) => {
        const opt = document.createElement('option')
        opt.value = k
        opt.textContent = getLuminodeDisplayName(k)
        g.appendChild(opt)
      })
      this.sourceSelect.appendChild(g)
    }

    if (selectedKey) this.sourceSelect.value = selectedKey
  }

  setModuleBundle (values, schema) {
    this.moduleSettings = deepClone(values || DEFAULT_MODULE_SETTINGS)
    this.configSchema = Array.isArray(schema) && schema.length
      ? deepClone(schema)
      : inferConfigSchema(this.moduleSettings, DEFAULT_CONFIG_SCHEMA)
    this.baselineModuleSettings = deepClone(this.moduleSettings)
    this.baselineConfigSchema = deepClone(this.configSchema)
    if (this.settingsPane && this.activeEditorTab === 'settings') {
      this.settingsPane.load(this.moduleSettings, this.configSchema)
    }
  }

  async show (luminodeKey = null) {
    if (!this.dialog) return
    this.ensureEditor()
    this.ensurePreview()
    this.applyPreviewWidth()
    this.setMaximized(false)
    this.populateSourceSelect(luminodeKey)
    this.setSideTab('preview')
    this.setEditorTab('code')

    this.dialog.classList.add('show')
    this.isVisible = true
    this.refreshEditors()
    this.preview.start()

    if (luminodeKey) {
      await this.open(luminodeKey)
    } else {
      this.newFromTemplate()
    }
  }

  hide () {
    if (!this.isVisible) return
    this.isVisible = false
    this.dialog.classList.remove('show')
    this.setMaximized(false)
    if (this.preview) this.preview.stop()
    if (this.generatorPane) this.generatorPane.dispose()
    if (this.settingsPane) this.settingsPane.dispose()
    if (this.debounceTimer) clearTimeout(this.debounceTimer)
  }

  async open (key) {
    if (!key) return
    this.populateSourceSelect(key)

    if (isUserLuminodeId(key)) {
      const doc = getUserLuminode(key)
      if (!doc) {
        this.setError(new Error(`User luminode not found: ${key}`))
        return
      }
      this.loadDocument(doc, { builtinOnly: false })
      return
    }

    const url = getBuiltinSourceUrl(key)
    if (!url) {
      this.setError(new Error(`No source file for “${key}”`))
      return
    }

    try {
      const bundle = loadBuiltinModuleBundle(key)
      let source = await loadBuiltinSource(url)
      source = rewriteModuleAccess(source, bundle.settingsKey)

      const name = `${getLuminodeDisplayName(key)} Copy`
      this.docId = null
      this.originKey = key
      this.builtinOnly = true
      this.baselineSource = source
      this.setModuleBundle(bundle.values, bundle.schema)
      this.setName(name)
      this.setSource(source)
      this.dirty = false
      this.updateStatus()
      this.schedulePreview(true)
      this.setStatus(
        `Editing copy of built-in “${getLuminodeDisplayName(key)}” — Save creates your luminode`
      )
    } catch (err) {
      this.setError(err)
    }
  }

  loadDocument (doc, { builtinOnly = false } = {}) {
    this.docId = doc.id
    this.originKey = doc.forkedFrom || doc.id
    this.builtinOnly = builtinOnly
    this.baselineSource = doc.source
    this.setModuleBundle(
      doc.moduleSettings || DEFAULT_MODULE_SETTINGS,
      doc.configSchema
    )
    this.setName(doc.name)
    this.setSource(doc.source)
    this.dirty = false
    this.populateSourceSelect(doc.id)
    this.updateStatus()
    this.schedulePreview(true)
  }

  newFromTemplate () {
    const source = LUMINODE_TEMPLATE
    this.docId = null
    this.originKey = null
    this.builtinOnly = false
    this.baselineSource = source
    this.setModuleBundle(DEFAULT_MODULE_SETTINGS, DEFAULT_CONFIG_SCHEMA)
    this.setName(TEMPLATE_DISPLAY_NAME)
    this.setSource(source)
    this.dirty = true
    if (this.sourceSelect) this.sourceSelect.value = ''
    this.updateStatus()
    this.schedulePreview(true)
    this.setStatus('New luminode from template')
  }

  fork () {
    const source = this.getSource()
    const baseName = this.getName() || 'Luminode'
    const name = /fork$/i.test(baseName) ? baseName : `${baseName} Fork`
    const forkedFrom = this.docId || this.originKey || null
    this.docId = null
    this.builtinOnly = false
    this.originKey = forkedFrom
    this.baselineSource = source
    this.moduleSettings = deepClone(this.moduleSettings)
    this.configSchema = deepClone(this.configSchema)
    this.baselineModuleSettings = deepClone(this.moduleSettings)
    this.baselineConfigSchema = deepClone(this.configSchema)
    if (this.settingsPane && this.activeEditorTab === 'settings') {
      this.settingsPane.load(this.moduleSettings, this.configSchema)
    }
    this.setName(name)
    this.dirty = true
    if (this.sourceSelect) this.sourceSelect.value = ''
    this.updateStatus()
    this.setStatus('Forked — Save to create a new user luminode')
    this.schedulePreview(true)
  }

  reset () {
    this.setSource(this.baselineSource)
    this.setModuleBundle(
      this.baselineModuleSettings || DEFAULT_MODULE_SETTINGS,
      this.baselineConfigSchema || DEFAULT_CONFIG_SCHEMA
    )
    this.dirty = false
    this.updateStatus()
    this.schedulePreview(true)
    this.setStatus('Reverted to last loaded source & settings')
  }

  save () {
    const source = this.getSource()
    const compiled = compileLuminodeSource(source, {
      module: this.moduleSettings
    })
    if (!compiled.ok) {
      this.setError(compiled.error)
      this.setStatus('Fix errors before saving')
      return
    }

    const name = this.getName().trim() || 'Untitled'
    const moduleSettings = deepClone(this.moduleSettings)
    const configSchema = deepClone(
      this.configSchema?.length
        ? this.configSchema
        : inferConfigSchema(moduleSettings, DEFAULT_CONFIG_SCHEMA)
    )

    let doc
    if (this.docId && !this.builtinOnly) {
      doc = createUserLuminode({
        id: this.docId,
        name,
        source,
        moduleSettings,
        configSchema,
        forkedFrom: this.originKey && !isUserLuminodeId(this.originKey)
          ? this.originKey
          : getUserLuminode(this.docId)?.forkedFrom || null
      })
    } else {
      doc = createUserLuminode({
        name,
        source,
        moduleSettings,
        configSchema,
        forkedFrom:
          this.originKey && !isUserLuminodeId(this.originKey)
            ? this.originKey
            : null
      })
    }

    const registered = registerUserLuminode(doc, this.hooks)
    if (!registered.ok) {
      this.setError(registered.error)
      return
    }

    upsertUserLuminode(doc)
    this.refreshTrackInstances(doc.id)

    this.docId = doc.id
    this.builtinOnly = false
    this.baselineSource = source
    this.baselineModuleSettings = deepClone(moduleSettings)
    this.baselineConfigSchema = deepClone(configSchema)
    this.dirty = false
    this.populateSourceSelect(doc.id)
    this.setError(null)
    this.updateStatus()
    this.setStatus(`Saved “${doc.name}”`)

    if (typeof this.hooks.onSaved === 'function') {
      this.hooks.onSaved(doc)
    }
  }

  refreshTrackInstances (luminodeId) {
    const visualizer = this.hooks.visualizer
    const trackManager = this.hooks.trackManager
    if (!visualizer || !trackManager) return

    trackManager.getTracks().forEach((track) => {
      if (track.luminode === luminodeId) {
        visualizer.createLuminodeForTrack(track.id, luminodeId)
      }
    })
  }

  exportFile () {
    const source = this.getSource()
    const name = this.getName().trim() || 'luminode'
    const doc = createUserLuminode({
      id: this.docId || generateUserId(name),
      name,
      source,
      moduleSettings: deepClone(this.moduleSettings),
      configSchema: deepClone(this.configSchema),
      forkedFrom: this.originKey
    })
    downloadLuminodeFile(doc)
    this.setStatus(`Exported ${name}.luminode`)
  }

  importFile () {
    const input = document.getElementById('luminodeCenterFileInput')
    if (input) input.click()
  }

  onSourceChanged () {
    this.dirty = true
    this.updateStatus()
    this.schedulePreview()
  }

  schedulePreview (immediate = false) {
    if (this.debounceTimer) clearTimeout(this.debounceTimer)
    const run = () => {
      if (!this.preview) return
      this.preview.updateSource(this.getSource(), {
        module: this.moduleSettings
      })
    }
    if (immediate) run()
    else this.debounceTimer = setTimeout(run, PREVIEW_DEBOUNCE_MS)
  }

  getSource () {
    return this.cm ? this.cm.getValue() : ''
  }

  setSource (value) {
    if (this.cm) this.cm.setValue(value || '')
  }

  getName () {
    return this.nameInput ? this.nameInput.value : ''
  }

  setName (value) {
    if (this.nameInput) this.nameInput.value = value || ''
  }

  setError (err) {
    if (!this.errorEl) return
    if (!err) {
      this.errorEl.hidden = true
      this.errorEl.textContent = ''
      return
    }
    this.errorEl.hidden = false
    this.errorEl.textContent = err.message || String(err)
  }

  setStatus (msg) {
    if (this.statusEl) this.statusEl.textContent = msg || ''
  }

  updateStatus () {
    const parts = []
    if (this.docId) parts.push(this.docId)
    else if (this.builtinOnly) parts.push('unsaved copy')
    else parts.push('unsaved')
    if (this.dirty) parts.push('modified')
    const key = this.originKey && !isUserLuminodeId(this.originKey)
      ? getLuminodeSettingsKey(this.originKey)
      : null
    if (key) parts.push(`from ${key}`)
    this.setStatus(parts.join(' · '))
  }
}
