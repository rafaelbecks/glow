export class CreateSetDialog {
  constructor (setManager) {
    this.dialog = document.getElementById('createSetDialog')
    this.setManager = setManager
    this.callbacks = {}
    this.isVisible = false
    this.scenes = []
    this.draggedIndex = null
  }

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

  show (scenes) {
    if (this.isVisible) return

    this.scenes = scenes.map((scene) => ({ ...scene }))
    this.dialog.classList.add('show')
    this.isVisible = true

    const input = this.dialog.querySelector('#setName')
    if (input) {
      input.value = ''
      input.focus()
    }

    this.renderSceneList()
    this.validateForm()
  }

  hide () {
    if (!this.isVisible) return

    this.dialog.classList.remove('show')
    this.isVisible = false
    this.scenes = []
    this.draggedIndex = null
  }

  setupEventListeners () {
    if (!this.dialog) return

    const closeBtn = this.dialog.querySelector('#createSetDialogClose')
    const cancelBtn = this.dialog.querySelector('#createSetDialogCancel')
    const saveBtn = this.dialog.querySelector('#createSetDialogSave')
    const input = this.dialog.querySelector('#setName')
    const dialog = this.dialog

    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.hide())
    }

    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => this.hide())
    }

    if (saveBtn) {
      saveBtn.addEventListener('click', () => this.handleSave())
    }

    if (input) {
      input.addEventListener('input', () => this.validateForm())
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault()
          this.handleSave()
        } else if (e.key === 'Escape') {
          e.preventDefault()
          this.hide()
        }
      })
    }

    if (dialog) {
      dialog.addEventListener('click', (e) => {
        if (e.target === dialog) this.hide()
      })
    }
  }

  renderSceneList () {
    const list = this.dialog.querySelector('#setSceneList')
    if (!list) return

    list.innerHTML = ''

    this.scenes.forEach((scene, index) => {
      const item = document.createElement('li')
      item.className = 'set-scene-item'
      item.draggable = true
      item.dataset.index = String(index)

      const handle = document.createElement('span')
      handle.className = 'set-scene-drag-handle'
      handle.textContent = '⋮⋮'
      handle.setAttribute('aria-hidden', 'true')

      const content = document.createElement('div')
      content.className = 'set-scene-content'

      const header = document.createElement('div')
      header.className = 'set-scene-header'

      const position = document.createElement('span')
      position.className = 'set-scene-position'
      position.textContent = `${index + 1}.`

      const title = document.createElement('span')
      title.className = 'set-scene-title'
      title.textContent = scene.name

      const fileName = document.createElement('span')
      fileName.className = 'set-scene-filename'
      fileName.textContent = scene.fileName

      header.appendChild(position)
      header.appendChild(title)
      header.appendChild(fileName)

      const summary = document.createElement('ul')
      summary.className = 'set-scene-summary'

      const tracks = scene.summary || []
      if (tracks.length === 0) {
        const empty = document.createElement('li')
        empty.className = 'set-scene-summary-empty'
        empty.textContent = 'No track data'
        summary.appendChild(empty)
      } else {
        tracks.forEach((track) => {
          const trackItem = document.createElement('li')
          const midi = track.midiDevice || 'No MIDI'
          const luminode = track.luminode || 'No luminode'
          trackItem.textContent = `${track.name}: ${midi} · ${luminode}`
          summary.appendChild(trackItem)
        })
      }

      content.appendChild(header)
      content.appendChild(summary)
      item.appendChild(handle)
      item.appendChild(content)

      item.addEventListener('dragstart', (e) => this.onDragStart(e, index))
      item.addEventListener('dragend', () => this.onDragEnd())
      item.addEventListener('dragover', (e) => this.onDragOver(e))
      item.addEventListener('drop', (e) => this.onDrop(e, index))

      list.appendChild(item)
    })
  }

  onDragStart (e, index) {
    this.draggedIndex = index
    e.currentTarget.classList.add('dragging')
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', String(index))
  }

  onDragEnd () {
    this.draggedIndex = null
    const items = this.dialog.querySelectorAll('.set-scene-item')
    items.forEach((item) => item.classList.remove('dragging', 'drag-over'))
  }

  onDragOver (e) {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    e.currentTarget.classList.add('drag-over')
  }

  onDrop (e, dropIndex) {
    e.preventDefault()
    e.currentTarget.classList.remove('drag-over')

    const dragIndex = this.draggedIndex
    if (dragIndex === null || dragIndex === dropIndex) return

    const [moved] = this.scenes.splice(dragIndex, 1)
    this.scenes.splice(dropIndex, 0, moved)
    this.renderSceneList()
  }

  validateSetName (name) {
    if (!name || name.length === 0) {
      this.showError('Set name is required')
      return false
    }

    if (name.length < 2) {
      this.showError('Set name must be at least 2 characters')
      return false
    }

    if (name.length > 50) {
      this.showError('Set name must be less than 50 characters')
      return false
    }

    const invalidChars = /[<>:"/\\|?*]/
    if (invalidChars.test(name)) {
      this.showError('Set name contains invalid characters')
      return false
    }

    return true
  }

  validateForm () {
    const input = this.dialog.querySelector('#setName')
    const saveBtn = this.dialog.querySelector('#createSetDialogSave')
    if (!input || !saveBtn) return

    const name = input.value.trim()
    const isValid = name.length >= 2 && name.length <= 50 && !/[<>:"/\\|?*]/.test(name)
    saveBtn.disabled = !isValid || this.scenes.length === 0
  }

  handleSave () {
    const input = this.dialog.querySelector('#setName')
    if (!input) return

    const setName = input.value.trim()
    if (!this.validateSetName(setName)) return

    this.triggerCallback('save', {
      setName,
      scenes: this.scenes
    })
    this.hide()
  }

  showError (message) {
    const existingError = this.dialog.querySelector('.error-message')
    if (existingError) existingError.remove()

    const errorEl = document.createElement('div')
    errorEl.className = 'error-message'
    errorEl.textContent = message

    const dialogBody = this.dialog.querySelector('.create-set-dialog-body')
    if (dialogBody) {
      dialogBody.insertAdjacentElement('afterend', errorEl)
    }

    setTimeout(() => {
      if (errorEl.parentNode) errorEl.remove()
    }, 3000)
  }
}
