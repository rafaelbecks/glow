/**
 * GLOW-styled confirm / alert dialog (Promise-based).
 */
export class ConfirmDialog {
  constructor () {
    this.dialog = document.getElementById('glowConfirmDialog')
    this.titleEl = document.getElementById('glowConfirmTitle')
    this.messageEl = document.getElementById('glowConfirmMessage')
    this.confirmBtn = document.getElementById('glowConfirmOk')
    this.cancelBtn = document.getElementById('glowConfirmCancel')
    this.closeBtn = document.getElementById('glowConfirmClose')
    this.resolve = null
    this.mode = 'confirm'
    this.setupEventListeners()
  }

  setupEventListeners () {
    if (!this.dialog) return

    const finish = (value) => {
      if (!this.resolve) return
      const resolve = this.resolve
      this.resolve = null
      this.hide()
      resolve(value)
    }

    if (this.confirmBtn) {
      this.confirmBtn.addEventListener('click', () => {
        finish(this.mode === 'alert' ? undefined : true)
      })
    }
    if (this.cancelBtn) {
      this.cancelBtn.addEventListener('click', () => finish(false))
    }
    if (this.closeBtn) {
      this.closeBtn.addEventListener('click', () => {
        finish(this.mode === 'alert' ? undefined : false)
      })
    }

    this.dialog.addEventListener('click', (e) => {
      if (e.target === this.dialog) {
        finish(this.mode === 'alert' ? undefined : false)
      }
    })

    document.addEventListener(
      'keydown',
      (e) => {
        if (!this.isVisible()) return
        if (e.key === 'Escape') {
          e.preventDefault()
          e.stopImmediatePropagation()
          finish(this.mode === 'alert' ? undefined : false)
        } else if (e.key === 'Enter' && this.mode === 'confirm') {
          e.preventDefault()
          e.stopImmediatePropagation()
          finish(true)
        }
      },
      true
    )
  }

  isVisible () {
    return !!this.dialog?.classList.contains('show')
  }

  hide () {
    if (this.dialog) this.dialog.classList.remove('show')
  }

  /**
   * @param {{ title?: string, message: string, confirmLabel?: string, cancelLabel?: string, danger?: boolean }} opts
   * @returns {Promise<boolean>}
   */
  confirm ({
    title = 'Confirm',
    message,
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    danger = false
  } = {}) {
    return new Promise((resolve) => {
      this.mode = 'confirm'
      this.resolve = resolve
      this.render({
        title,
        message,
        confirmLabel,
        cancelLabel,
        danger,
        showCancel: true
      })
    })
  }

  /**
   * @param {{ title?: string, message: string, okLabel?: string }} opts
   * @returns {Promise<void>}
   */
  alert ({ title = 'Notice', message, okLabel = 'OK' } = {}) {
    return new Promise((resolve) => {
      this.mode = 'alert'
      this.resolve = () => resolve()
      this.render({
        title,
        message,
        confirmLabel: okLabel,
        cancelLabel: '',
        danger: false,
        showCancel: false
      })
    })
  }

  render ({ title, message, confirmLabel, cancelLabel, danger, showCancel }) {
    if (!this.dialog) {
      // Fallback if markup missing
      if (this.mode === 'alert') {
        window.alert(message)
        this.resolve?.()
      } else {
        this.resolve?.(window.confirm(message))
      }
      this.resolve = null
      return
    }

    if (this.titleEl) this.titleEl.textContent = title
    if (this.messageEl) this.messageEl.textContent = message

    if (this.confirmBtn) {
      this.confirmBtn.textContent = confirmLabel
      this.confirmBtn.classList.toggle('btn-danger', !!danger)
      this.confirmBtn.classList.toggle('btn-primary', !danger)
    }

    if (this.cancelBtn) {
      this.cancelBtn.hidden = !showCancel
      this.cancelBtn.textContent = cancelLabel || 'Cancel'
    }

    this.dialog.classList.add('show')
    requestAnimationFrame(() => {
      this.confirmBtn?.focus()
    })
  }
}

/** Shared singleton for simple call sites */
let shared = null

export function getConfirmDialog () {
  if (!shared) shared = new ConfirmDialog()
  return shared
}
