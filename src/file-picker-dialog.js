// File picker dialog component for project loading
export class FilePickerDialog {
  constructor () {
    this.dialog = document.getElementById('filePickerDialog')
    this.callbacks = {}
    this.isVisible = false
    this.fileInput = null
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

  // Show the file picker dialog
  show () {
    if (this.isVisible) return

    this.dialog.classList.add('show')
    this.isVisible = true

    // Focus the file input
    if (this.fileInput) {
      this.fileInput.focus()
    }
  }

  // Hide the file picker dialog
  hide () {
    if (!this.isVisible) return

    this.dialog.classList.remove('show')
    this.isVisible = false
  }

  // Setup event listeners
  setupEventListeners () {
    if (!this.dialog) return

    const closeBtn = this.dialog.querySelector('#filePickerDialogClose')
    const cancelBtn = this.dialog.querySelector('#filePickerDialogCancel')
    const browseBtn = this.dialog.querySelector('#filePickerDialogBrowse')
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

    // Browse button
    if (browseBtn) {
      browseBtn.addEventListener('click', () => {
        this.triggerFileSelection()
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

    // Setup file input
    this.setupFileInput()
  }

  // Setup hidden file input
  setupFileInput () {
    this.fileInput = document.createElement('input')
    this.fileInput.type = 'file'
    this.fileInput.accept = '.glow,application/json'
    this.fileInput.style.display = 'none'
    document.body.appendChild(this.fileInput)

    this.fileInput.addEventListener('change', (e) => {
      this.handleFileSelection(e)
    })
  }

  // Trigger file selection
  triggerFileSelection () {
    if (this.fileInput) {
      this.fileInput.click()
    }
  }

  // Handle file selection
  handleFileSelection (event) {
    const file = event.target.files[0]
    if (!file) return

    // Validate file extension
    if (!file.name.toLowerCase().endsWith('.glow')) {
      this.showError('Please select a valid .glow project file')
      return
    }

    // Read file content
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const projectData = JSON.parse(e.target.result)
        this.triggerCallback('fileSelected', { file, projectData })
        this.hide()
      } catch (error) {
        console.error('Error parsing project file:', error)
        this.showError('Invalid project file format')
      }
    }
    reader.onerror = () => {
      this.showError('Error reading file')
    }
    reader.readAsText(file)
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

    // Insert after the dialog body
    const dialogBody = this.dialog.querySelector('.file-picker-dialog-body')
    if (dialogBody) {
      dialogBody.insertAdjacentElement('afterend', errorEl)
    }

    // Auto-remove after 3 seconds
    setTimeout(() => {
      if (errorEl.parentNode) {
        errorEl.remove()
      }
    }, 3000)
  }

  // Cleanup
  destroy () {
    if (this.fileInput && this.fileInput.parentNode) {
      this.fileInput.parentNode.removeChild(this.fileInput)
    }
  }
}
