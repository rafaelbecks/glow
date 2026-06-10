import { FILE_TYPE } from './glow-file-types.js'

function cloneProjectData (data) {
  return JSON.parse(JSON.stringify(data))
}

export class SetManager {
  constructor (projectManager) {
    this.projectManager = projectManager
    this.setFileHandle = null
    this.setName = null
    this.scenes = []
    this.activeSceneIndex = -1
    this.savedSetState = null
  }

  isActive () {
    return this.scenes.length > 0 && this.activeSceneIndex >= 0
  }

  getSceneCount () {
    return this.scenes.length
  }

  getActiveSceneIndex () {
    return this.activeSceneIndex
  }

  getActiveScene () {
    if (!this.isActive()) return null
    return this.scenes[this.activeSceneIndex]
  }

  extractSceneSummary (projectData) {
    const tracks = projectData?.tracks?.tracks || []
    return tracks.map((track) => ({
      id: track.id,
      name: track.name,
      midiDevice: track.midiDeviceInfo?.name || null,
      luminode: track.luminode || null
    }))
  }

  buildSceneEntry (fileName, projectData) {
    return {
      fileName,
      name: projectData.name || fileName.replace(/\.glow$/, ''),
      summary: this.extractSceneSummary(projectData),
      projectData
    }
  }

  buildSetState (setName, scenes) {
    return {
      fileType: FILE_TYPE.SET,
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      name: setName,
      scenes: scenes.map((scene) => ({
        fileName: scene.fileName,
        name: scene.name,
        summary: scene.summary,
        projectData: scene.projectData
      }))
    }
  }

  validateSetFile (setData) {
    if (!setData || setData.fileType !== FILE_TYPE.SET) {
      throw new Error('Invalid set file: missing or incorrect fileType')
    }

    const requiredFields = ['version', 'name', 'scenes']
    for (const field of requiredFields) {
      if (!Object.prototype.hasOwnProperty.call(setData, field)) {
        throw new Error(`Invalid set file: missing required field '${field}'`)
      }
    }

    if (!Array.isArray(setData.scenes) || setData.scenes.length === 0) {
      throw new Error('Invalid set file: scenes must be a non-empty array')
    }

    for (const scene of setData.scenes) {
      if (!scene.fileName || !scene.projectData) {
        throw new Error('Invalid set file: each scene must have fileName and projectData')
      }
      this.projectManager.validateProjectFile(scene.projectData)
    }

    return true
  }

  loadSet (setFileHandle, setData) {
    this.validateSetFile(setData)

    this.setFileHandle = setFileHandle
    this.setName = setData.name
    this.scenes = setData.scenes.map((scene) => ({
      fileName: scene.fileName,
      name: scene.name,
      summary: scene.summary || this.extractSceneSummary(scene.projectData),
      projectData: cloneProjectData(scene.projectData)
    }))
    // Leave inactive until switchToScene loads the first scene's project data
    this.activeSceneIndex = -1
    this.savedSetState = this.getSetSnapshot()
  }

  getSetSnapshot () {
    return this.buildSetState(this.setName, this.scenes)
  }

  updateActiveSceneData () {
    if (!this.isActive()) return
    const scene = this.scenes[this.activeSceneIndex]
    scene.projectData = cloneProjectData(
      this.projectManager.collectProjectState()
    )
    scene.projectData.name = scene.name
    scene.summary = this.extractSceneSummary(scene.projectData)
  }

  checkForUnsavedChanges () {
    if (!this.isActive() || !this.savedSetState) return false

    this.updateActiveSceneData()

    const current = this.getSetSnapshot()
    const saved = { ...this.savedSetState }
    const currentCopy = { ...current }

    delete saved.timestamp
    delete currentCopy.timestamp

    return JSON.stringify(currentCopy) !== JSON.stringify(saved)
  }

  clear () {
    this.setFileHandle = null
    this.setName = null
    this.scenes = []
    this.activeSceneIndex = -1
    this.savedSetState = null
  }

  getDisplayName () {
    if (!this.isActive()) return this.setName || 'Untitled Set'
    const scene = this.getActiveScene()
    const position = this.activeSceneIndex + 1
    return `${this.setName} (${position}/${this.scenes.length}: ${scene.name})`
  }

  async switchToScene (index) {
    if (index < 0 || index >= this.scenes.length) return false
    if (index === this.activeSceneIndex) return true

    this.updateActiveSceneData()

    const scene = this.scenes[index]
    const loadSuccess = await this.projectManager.loadProjectState(
      cloneProjectData(scene.projectData)
    )
    if (!loadSuccess) {
      throw new Error(`Failed to load scene "${scene.name}"`)
    }

    this.activeSceneIndex = index
    this.projectManager.currentProjectName = scene.name
    this.projectManager.savedState = this.projectManager.getCurrentState()
    this.projectManager.hasUnsavedChanges = false

    return true
  }
}
