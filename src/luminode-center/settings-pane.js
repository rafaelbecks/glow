/**
 * Settings tab: JSON editor + live Tweakpane bound to MODULE values.
 */
import { Pane } from '../lib/tweakpane.min.js'
import { inferConfigSchema } from './settings-helpers.js'

export class LuminodeSettingsPane {
  /**
   * @param {object} opts
   * @param {HTMLElement} opts.jsonHost
   * @param {HTMLElement} opts.tweakHost
   * @param {HTMLElement} [opts.errorEl]
   * @param {(values: object, schema: array) => void} [opts.onChange]
   */
  constructor ({ jsonHost, tweakHost, errorEl, onChange } = {}) {
    this.jsonHost = jsonHost
    this.tweakHost = tweakHost
    this.errorEl = errorEl || null
    this.onChange = onChange || null

    this.cm = null
    this.pane = null
    this.values = {}
    this.schema = []
    this.suppressJson = false
    this.debounce = null
  }

  ensureJsonEditor () {
    if (this.cm || !this.jsonHost) return

    if (typeof window.CodeMirror === 'undefined') {
      const ta = document.createElement('textarea')
      ta.className = 'luminode-center-fallback-editor'
      ta.addEventListener('input', () => this.onJsonInput())
      this.jsonHost.appendChild(ta)
      this.cm = {
        getValue: () => ta.value,
        setValue: (v) => { ta.value = v },
        refresh: () => {}
      }
      return
    }

    this.cm = window.CodeMirror(this.jsonHost, {
      value: '{}',
      mode: { name: 'javascript', json: true },
      theme: 'material-darker',
      lineNumbers: true,
      lineWrapping: true,
      indentUnit: 2,
      tabSize: 2
    })
    this.cm.on('change', () => {
      if (this.suppressJson) return
      this.onJsonInput()
    })
  }

  /**
   * @param {object} values - mutable MODULE bag (same object reference kept)
   * @param {array} schema
   */
  load (values, schema = []) {
    this.ensureJsonEditor()
    this.values = values || {}
    this.schema = Array.isArray(schema) ? schema : []
    this.writeJsonFromValues()
    this.rebuildTweakpane()
    this.setError(null)
  }

  getValues () {
    return this.values
  }

  getSchema () {
    return this.schema
  }

  writeJsonFromValues () {
    if (!this.cm) return
    this.suppressJson = true
    this.cm.setValue(JSON.stringify(this.values, null, 2))
    this.suppressJson = false
    if (this.cm.refresh) {
      requestAnimationFrame(() => this.cm.refresh())
    }
  }

  onJsonInput () {
    clearTimeout(this.debounce)
    this.debounce = setTimeout(() => this.applyJson(), 280)
  }

  applyJson () {
    if (!this.cm) return
    try {
      const parsed = JSON.parse(this.cm.getValue())
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        throw new Error('Settings JSON must be an object')
      }
      // Mutate in place so MODULE reference stays valid
      Object.keys(this.values).forEach((k) => {
        if (!(k in parsed)) delete this.values[k]
      })
      Object.assign(this.values, parsed)
      this.schema = inferConfigSchema(this.values, this.schema)
      this.rebuildTweakpane()
      this.setError(null)
      if (this.onChange) this.onChange(this.values, this.schema)
    } catch (err) {
      this.setError(err)
    }
  }

  rebuildTweakpane () {
    if (!this.tweakHost) return
    if (this.pane) {
      try { this.pane.dispose() } catch (_) {}
      this.pane = null
    }
    this.tweakHost.innerHTML = ''

    const schema = this.schema.length
      ? this.schema
      : inferConfigSchema(this.values, [])

    if (!schema.length) {
      this.tweakHost.innerHTML =
        '<p class="luminode-center-settings-empty">Add keys in the JSON above to create live controls.</p>'
      return
    }

    this.pane = new Pane({ container: this.tweakHost, title: 'Live' })
    this.stylePane()

    schema.forEach((param) => {
      this.bindParam(param)
    })
  }

  stylePane () {
    const apply = () => {
      const el = this.tweakHost.querySelector('.tp-rotv')
      if (el) {
        el.style.width = '100%'
        el.style.margin = '0'
        el.style.background = 'transparent'
        el.style.border = 'none'
      } else {
        requestAnimationFrame(apply)
      }
    }
    requestAnimationFrame(apply)
  }

  bindParam (param) {
    const key = param.key
    if (!(key in this.values)) {
      this.values[key] = deepDefault(param)
    }

    const notify = () => {
      this.writeJsonFromValues()
      if (this.onChange) this.onChange(this.values, this.schema)
    }

    if (param.type === 'checkbox') {
      this.pane.addBinding(this.values, key, { label: param.label || key })
        .on('change', notify)
      return
    }

    if (param.type === 'rotation') {
      if (!this.values[key] || typeof this.values[key] !== 'object') {
        this.values[key] = { x: 0, y: 0, z: 0 }
      }
      const folder = this.pane.addFolder({ title: param.label || key, expanded: false })
      ;['x', 'y', 'z'].forEach((axis) => {
        if (typeof this.values[key][axis] !== 'number') this.values[key][axis] = 0
        folder.addBinding(this.values[key], axis, {
          label: axis.toUpperCase(),
          min: -180,
          max: 180,
          step: 1
        }).on('change', notify)
      })
      return
    }

    if (param.type === 'select' && Array.isArray(param.options)) {
      const options = {}
      param.options.forEach((opt) => {
        options[opt.label || opt.value] = opt.value
      })
      this.pane.addBinding(this.values, key, {
        label: param.label || key,
        options
      }).on('change', notify)
      return
    }

    if (param.type === 'text') {
      this.pane.addBinding(this.values, key, { label: param.label || key })
        .on('change', notify)
      return
    }

    if (param.type === 'json') {
      // Skip nested opaque blobs in tweakpane; edit via JSON
      return
    }

    // slider / number
    const opts = { label: param.label || key }
    if (typeof param.min === 'number') opts.min = param.min
    if (typeof param.max === 'number') opts.max = param.max
    if (typeof param.step === 'number') opts.step = param.step
    this.pane.addBinding(this.values, key, opts).on('change', notify)
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

  refresh () {
    if (this.cm?.refresh) this.cm.refresh()
  }

  dispose () {
    if (this.pane) {
      try { this.pane.dispose() } catch (_) {}
      this.pane = null
    }
  }
}

function deepDefault (param) {
  if (param.default !== undefined) {
    return typeof param.default === 'object'
      ? JSON.parse(JSON.stringify(param.default))
      : param.default
  }
  if (param.type === 'checkbox') return false
  if (param.type === 'rotation') return { x: 0, y: 0, z: 0 }
  if (param.type === 'text') return ''
  return 0
}
