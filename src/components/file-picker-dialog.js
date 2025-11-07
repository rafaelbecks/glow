export class FilePickerDialog {
  constructor (projectManager) {
    this.dialog = document.getElementById('filePickerDialog')
    this.callbacks = {}
    this.isVisible = false
    this.fileInput = null
    this.projectManager = projectManager
  }

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

  show () {
    if (this.isVisible) return

    this.dialog.classList.add('show')
    this.isVisible = true
    // this.renderRecentProjects()
  }

  hide () {
    if (!this.isVisible) return

    this.dialog.classList.remove('show')
    this.isVisible = false
  }

  setupEventListeners () {
    if (!this.dialog) return

    const closeBtn = this.dialog.querySelector('#filePickerDialogClose')
    const cancelBtn = this.dialog.querySelector('#filePickerDialogCancel')
    const browseBtn = this.dialog.querySelector('#filePickerDialogBrowse')
    const dialog = this.dialog

    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        this.hide()
      })
    }

    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => {
        this.hide()
      })
    }

    if (browseBtn) {
      browseBtn.addEventListener('click', () => {
        this.triggerFileSelection()
      })
    }

    if (dialog) {
      dialog.addEventListener('click', (e) => {
        if (e.target === dialog) {
          this.hide()
        }
      })
    }

    this.setupFileInput()
  }

  setupFileInput () {
  }

  async triggerFileSelection () {
    try {
      if (!('showOpenFilePicker' in window)) {
        this.showError('File System Access API is not supported in this browser')
        return
      }

      document.body.classList.add('loading')
      let fileHandle
      try {
        const [selectedHandle] = await window.showOpenFilePicker({
          types: [{
            description: 'Glow Project Files',
            accept: {
              'application/json': ['.glow']
            }
          }],
          multiple: false
        })
        fileHandle = selectedHandle
      } finally {
        document.body.classList.remove('loading')
      }

      const file = await fileHandle.getFile()
      const content = await file.text()
      const projectData = JSON.parse(content)

      this.triggerCallback('fileSelected', {
        file,
        projectData,
        fileHandle
      })
      this.hide()
    } catch (error) {
      document.body.classList.remove('loading')
      if (error.name === 'AbortError') {
        return
      }
      console.error('Error opening file:', error)
      this.showError('Error opening file. Check console for details.')
    }
  }

  renderRecentProjects () {
    if (!this.projectManager) return

    const recentProjects = this.projectManager.getRecentProjects()
    const recentProjectsContainer = this.dialog.querySelector('.recent-projects-list')

    if (!recentProjectsContainer) {
      const dialogBody = this.dialog.querySelector('.file-picker-dialog-body')
      if (dialogBody) {
        const container = document.createElement('div')
        container.className = 'recent-projects-list'
        dialogBody.insertBefore(container, dialogBody.firstChild)
      }
      return
    }

    recentProjectsContainer.innerHTML = ''

    if (recentProjects.length === 0) {
      const emptyMsg = document.createElement('p')
      emptyMsg.className = 'recent-projects-empty'
      emptyMsg.textContent = 'No recent projects'
      recentProjectsContainer.appendChild(emptyMsg)
      return
    }

    const list = document.createElement('ul')
    list.className = 'recent-projects-items'

    recentProjects.forEach((project) => {
      const item = document.createElement('li')
      item.className = 'recent-project-item'

      const name = document.createElement('div')
      name.className = 'recent-project-item-name'
      name.textContent = project.projectName || project.fileName

      const path = document.createElement('div')
      path.className = 'recent-project-item-path'
      path.textContent = project.fileName

      item.appendChild(name)
      item.appendChild(path)

      item.addEventListener('click', () => {
        this.triggerFileSelection()
      })

      list.appendChild(item)
    })

    recentProjectsContainer.appendChild(list)
  }

  showError (message) {
    const existingError = this.dialog.querySelector('.error-message')
    if (existingError) {
      existingError.remove()
    }

    const errorEl = document.createElement('div')
    errorEl.className = 'error-message'
    errorEl.textContent = message

    const dialogBody = this.dialog.querySelector('.file-picker-dialog-body')
    if (dialogBody) {
      dialogBody.insertAdjacentElement('afterend', errorEl)
    }

    setTimeout(() => {
      if (errorEl.parentNode) {
        errorEl.remove()
      }
    }, 3000)
  }

  destroy () {
    if (this.fileInput && this.fileInput.parentNode) {
      this.fileInput.parentNode.removeChild(this.fileInput)
    }
  }
}
