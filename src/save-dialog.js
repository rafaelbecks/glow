// Save dialog component for project saving
export class SaveDialog {
  constructor () {
    this.dialog = document.getElementById('saveDialog')
    this.callbacks = {}
    this.isVisible = false
    this.defaultName = null
  }

  // Callback system
  on (event, callback) {
    if (!this.callbacks[event]) {
      this.callbacks[event] = []
    }
    this.callbacks[event].push(callback)
  }

  triggerCallback (event, data) {
    if (this.callbacks[event]) {
      this.callbacks[event].forEach(callback => callback(data))
    }
  }

  // Show the save dialog
  show () {
    if (this.isVisible) return

    this.dialog.classList.add('show')
    this.isVisible = true

    // Set default name if available
    const input = this.dialog.querySelector('#projectName')
    if (input) {
      if (this.defaultName) {
        input.value = this.defaultName
        this.validateInput(this.defaultName)
      }
      input.focus()
      input.select()
    }
  }

  // Hide the save dialog
  hide () {
    if (!this.isVisible) return

    this.dialog.classList.remove('show')
    this.isVisible = false
  }

  // Setup event listeners
  setupEventListeners () {
    if (!this.dialog) return

    const closeBtn = this.dialog.querySelector('#saveDialogClose')
    const cancelBtn = this.dialog.querySelector('#saveDialogCancel')
    const saveBtn = this.dialog.querySelector('#saveDialogSave')
    const input = this.dialog.querySelector('#projectName')
    const dialog = this.dialog

    // Close button
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        this.hide()
      })
    }

    // Cancel button
    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => {
        this.hide()
      })
    }

    // Save button
    if (saveBtn) {
      saveBtn.addEventListener('click', () => {
        this.handleSave()
      })
    }

    // Input enter key
    if (input) {
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault()
          this.handleSave()
        } else if (e.key === 'Escape') {
          e.preventDefault()
          this.hide()
        }
      })

      // Input validation
      input.addEventListener('input', (e) => {
        this.validateInput(e.target.value)
      })
    }

    // Click outside to close
    if (dialog) {
      dialog.addEventListener('click', (e) => {
        if (e.target === dialog) {
          this.hide()
        }
      })
    }
  }

  // Handle save action
  handleSave () {
    const input = this.dialog.querySelector('#projectName')
    if (!input) return

    const projectName = input.value.trim()

    if (!this.validateProjectName(projectName)) {
      return
    }

    // Trigger save callback
    this.triggerCallback('save', { projectName })
    this.hide()
  }

  // Validate scene name
  validateProjectName (name) {
    if (!name || name.length === 0) {
      this.showError('Scene name is required')
      return false
    }

    if (name.length < 2) {
      this.showError('Scene name must be at least 2 characters')
      return false
    }

    if (name.length > 50) {
      this.showError('Scene name must be less than 50 characters')
      return false
    }

    // Check for invalid characters
    const invalidChars = /[<>:"/\\|?*]/
    if (invalidChars.test(name)) {
      this.showError('Scene name contains invalid characters')
      return false
    }

    return true
  }

  // Validate input in real-time
  validateInput (value) {
    const saveBtn = this.dialog.querySelector('#saveDialogSave')
    if (!saveBtn) return

    const isValid = this.validateProjectName(value)
    saveBtn.disabled = !isValid
  }

  // Show error message
  showError (message) {
    // Remove existing error
    const existingError = this.dialog.querySelector('.error-message')
    if (existingError) {
      existingError.remove()
    }

    // Create error element
    const errorEl = document.createElement('div')
    errorEl.className = 'error-message'
    errorEl.textContent = message

    // Insert after scene name input
    const sceneInput = this.dialog.querySelector('.scene-name-input')
    if (sceneInput) {
      sceneInput.insertAdjacentElement('afterend', errorEl)
    }

    // Auto-remove after 3 seconds
    setTimeout(() => {
      if (errorEl.parentNode) {
        errorEl.remove()
      }
    }, 3000)
  }

  // Set default project name
  setDefaultName (name) {
    this.defaultName = name
    // If dialog is already visible, update the input immediately
    if (this.isVisible && this.dialog) {
      const input = this.dialog.querySelector('#projectName')
      if (input) {
        input.value = name
        this.validateInput(name)
      }
    }
  }

  // Get current project name
  getCurrentName () {
    if (!this.dialog) return this.defaultName || ''
    const input = this.dialog.querySelector('#projectName')
    return input ? input.value.trim() : (this.defaultName || '')
  }
}
