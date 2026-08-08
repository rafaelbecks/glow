// Browser-side MIDI note generators (mirrors midi-test.js) that feed tracks
// directly without requiring a hardware / virtual MIDI device.
// Up to one generator per track (max 4). Note swaps overlap so luminodes
// never see an empty note list between intervals.

export const INTERVALS = {
  third: 4,
  fourth: 5,
  fifth: 7,
  sixth: 9
}

const MIN_NOTE = 48 // C3
const MAX_NOTE = 84 // C6
const MAX_GENERATORS = 4

function defaultGeneratorConfig (trackId) {
  return {
    trackId,
    enabled: true,
    intervalMs: 2000,
    intervalMode: 'fifth',
    numberOfNotes: 2,
    velocity: 100,
    velocityRandom: 0
  }
}

export class MidiGenerator {
  constructor (midiManager, trackManager) {
    this.midiManager = midiManager
    this.trackManager = trackManager

    this.generators = []
    this.nextId = 1
    this.midiOutEnabled = false
    this.onChange = null

    /** @type {Map<string, { intervalId: number|null, activeNotes: number[] }>} */
    this.runtime = new Map()
  }

  notifyChange () {
    if (typeof this.onChange === 'function') this.onChange()
  }

  getGenerators () {
    return this.generators.map((g) => ({ ...g }))
  }

  /** Snapshot for .glow project files */
  getSerializableState () {
    return {
      generators: this.getGenerators(),
      midiOutEnabled: this.midiOutEnabled
    }
  }

  clearAll () {
    const snapshot = [...this.generators]
    snapshot.forEach((g) => {
      this.stopGenerator(g.id)
      this.midiManager.clearTrackNotes(g.trackId)
    })
    this.generators = []
    this.runtime.clear()
    this.syncOwnership()
  }

  /**
   * Restore generators from a project snapshot.
   * @param {{ generators?: object[], midiOutEnabled?: boolean }|null} state
   */
  loadState (state) {
    const prevOnChange = this.onChange
    this.onChange = null
    try {
      this.clearAll()
      if (!state) {
        this.setMidiOutEnabled(false)
        return
      }

      this.setMidiOutEnabled(!!state.midiOutEnabled)

      const list = Array.isArray(state.generators) ? state.generators : []
      const usedTracks = new Set()
      let maxIdNum = 0

      list.slice(0, MAX_GENERATORS).forEach((data) => {
        if (!data || typeof data !== 'object') return

        const trackId = Number(data.trackId)
        if (!Number.isFinite(trackId) || usedTracks.has(trackId)) return
        usedTracks.add(trackId)

        let id = typeof data.id === 'string' ? data.id : null
        if (!id) {
          id = `gen-${this.nextId++}`
        } else {
          const match = /^gen-(\d+)$/.exec(id)
          if (match) maxIdNum = Math.max(maxIdNum, parseInt(match[1], 10))
        }

        const defaults = defaultGeneratorConfig(trackId)
        const generator = {
          id,
          trackId,
          enabled: data.enabled !== undefined ? !!data.enabled : defaults.enabled,
          intervalMs: Number.isFinite(Number(data.intervalMs))
            ? Math.max(100, Math.min(10000, Math.round(Number(data.intervalMs))))
            : defaults.intervalMs,
          intervalMode: INTERVALS[data.intervalMode]
            ? data.intervalMode
            : defaults.intervalMode,
          numberOfNotes: Number.isFinite(Number(data.numberOfNotes))
            ? Math.max(1, Math.min(8, Math.round(Number(data.numberOfNotes))))
            : defaults.numberOfNotes,
          velocity: Number.isFinite(Number(data.velocity))
            ? Math.max(1, Math.min(127, Math.round(Number(data.velocity))))
            : defaults.velocity,
          velocityRandom: Number.isFinite(Number(data.velocityRandom))
            ? Math.max(0, Math.min(64, Math.round(Number(data.velocityRandom))))
            : defaults.velocityRandom
        }

        this.generators.push(generator)
        this.syncOwnership()
        if (generator.enabled) this.startGenerator(generator)
      })

      this.nextId = Math.max(this.nextId, maxIdNum + 1)
    } finally {
      this.onChange = prevOnChange
    }
  }

  getGenerator (id) {
    return this.generators.find((g) => g.id === id) || null
  }

  isAnyEnabled () {
    return this.generators.some((g) => g.enabled)
  }

  isTrackActive (trackId) {
    return this.generators.some((g) => g.enabled && g.trackId === trackId)
  }

  getUsedTrackIds (exceptId = null) {
    return this.generators
      .filter((g) => g.id !== exceptId)
      .map((g) => g.trackId)
  }

  getGeneratorForTrack (trackId) {
    return this.generators.find((g) => g.trackId === trackId) || null
  }

  /**
   * Add a generator for the track, or randomize an existing one.
   * @returns {'added'|'randomized'|null}
   */
  ensureOrRandomizeForTrack (trackId) {
    const existing = this.getGeneratorForTrack(trackId)
    if (existing) {
      this.randomizeGenerator(existing.id)
      return 'randomized'
    }
    if (this.generators.length >= MAX_GENERATORS) return null
    if (this.getUsedTrackIds().includes(trackId)) return null

    const id = this.addGenerator(trackId)
    return id ? 'added' : null
  }

  randomizeGenerator (id) {
    const generator = this.getGenerator(id)
    if (!generator) return

    const modes = Object.keys(INTERVALS)
    const intervalSteps = [250, 500, 750, 1000, 1500, 2000, 3000, 4000, 5000]
    this.updateGenerator(id, {
      enabled: true,
      intervalMs: intervalSteps[Math.floor(Math.random() * intervalSteps.length)],
      intervalMode: modes[Math.floor(Math.random() * modes.length)],
      numberOfNotes: 1 + Math.floor(Math.random() * 8),
      velocity: 40 + Math.floor(Math.random() * 88),
      velocityRandom: Math.floor(Math.random() * 33)
    })
  }

  getAvailableTrackId () {
    const used = new Set(this.getUsedTrackIds())
    const tracks = this.trackManager.getTracks()
    const free = tracks.find((t) => !used.has(t.id))
    return free ? free.id : null
  }

  canAddGenerator () {
    return (
      this.generators.length < MAX_GENERATORS &&
      this.getAvailableTrackId() !== null
    )
  }

  addGenerator (trackId = null) {
    if (this.generators.length >= MAX_GENERATORS) return null

    const resolvedTrackId = trackId ?? this.getAvailableTrackId()
    if (resolvedTrackId == null) return null
    if (this.getUsedTrackIds().includes(resolvedTrackId)) return null

    const id = `gen-${this.nextId++}`
    const generator = { id, ...defaultGeneratorConfig(resolvedTrackId) }
    this.generators.push(generator)
    this.syncOwnership()
    this.startGenerator(generator)
    this.notifyChange()
    return id
  }

  removeGenerator (id) {
    const index = this.generators.findIndex((g) => g.id === id)
    if (index === -1) return

    const trackId = this.generators[index].trackId
    this.stopGenerator(id)
    this.generators.splice(index, 1)
    if (!this.isTrackActive(trackId)) {
      this.midiManager.clearTrackNotes(trackId)
    }
    this.syncOwnership()
    this.notifyChange()
  }

  updateGenerator (id, updates = {}) {
    const generator = this.getGenerator(id)
    if (!generator) return

    const prevEnabled = generator.enabled
    const prevInterval = generator.intervalMs
    const prevTrackId = generator.trackId

    if (updates.trackId != null && updates.trackId !== generator.trackId) {
      const nextTrackId = Number(updates.trackId)
      if (this.getUsedTrackIds(id).includes(nextTrackId)) return
      this.releaseGeneratorNotes(id)
      generator.trackId = nextTrackId
    }

    if (updates.enabled != null) generator.enabled = !!updates.enabled
    if (updates.intervalMs != null) {
      generator.intervalMs = Math.max(100, Math.min(10000, Math.round(updates.intervalMs)))
    }
    if (updates.intervalMode != null && INTERVALS[updates.intervalMode]) {
      generator.intervalMode = updates.intervalMode
    }
    if (updates.numberOfNotes != null) {
      generator.numberOfNotes = Math.max(1, Math.min(8, Math.round(updates.numberOfNotes)))
    }
    if (updates.velocity != null) {
      generator.velocity = Math.max(1, Math.min(127, Math.round(updates.velocity)))
    }
    if (updates.velocityRandom != null) {
      generator.velocityRandom = Math.max(0, Math.min(64, Math.round(updates.velocityRandom)))
    }

    this.syncOwnership()

    if (generator.enabled && (!prevEnabled || generator.trackId !== prevTrackId)) {
      this.startGenerator(generator)
    } else if (!generator.enabled && prevEnabled) {
      this.stopGenerator(id)
    } else if (generator.enabled && generator.intervalMs !== prevInterval) {
      this.restartGenerator(generator)
    }

    this.notifyChange()
  }

  setMidiOutEnabled (enabled) {
    const next = !!enabled
    if (next === this.midiOutEnabled) {
      this.midiManager.setGenerateOutputEnabled(this.midiOutEnabled)
      return
    }
    this.midiOutEnabled = next
    this.midiManager.setGenerateOutputEnabled(this.midiOutEnabled)
    if (!this.midiOutEnabled) {
      this.releaseAllMidiOut()
    }
    this.notifyChange()
  }

  isMidiOutEnabled () {
    return this.midiOutEnabled
  }

  syncOwnership () {
    const owned = this.generators
      .filter((g) => g.enabled)
      .map((g) => g.trackId)
    this.midiManager.setGeneratorOwnedTracks(owned)
    this.midiManager.setGenerateModeActive(owned.length > 0)
  }

  startGenerator (generator) {
    this.stopGenerator(generator.id)
    if (!generator.enabled) return

    this.midiManager.ensureTrackNoteBucket(generator.trackId)

    const runtime = { intervalId: null, activeNotes: [] }
    this.runtime.set(generator.id, runtime)

    this.fire(generator)
    runtime.intervalId = setInterval(
      () => this.fire(generator),
      generator.intervalMs
    )
  }

  restartGenerator (generator) {
    if (!generator.enabled) return
    // Retarget the timer only — keep current notes to avoid a visual gap
    this.stopGeneratorTimers(generator.id)
    let runtime = this.runtime.get(generator.id)
    if (!runtime) {
      runtime = { intervalId: null, activeNotes: [] }
      this.runtime.set(generator.id, runtime)
      this.midiManager.ensureTrackNoteBucket(generator.trackId)
      this.fire(generator)
    }
    runtime.intervalId = setInterval(
      () => this.fire(generator),
      generator.intervalMs
    )
  }

  stopGenerator (id) {
    this.stopGeneratorTimers(id)
    this.releaseGeneratorNotes(id)
    this.runtime.delete(id)
  }

  stopGeneratorTimers (id) {
    const runtime = this.runtime.get(id)
    if (!runtime) return
    if (runtime.intervalId !== null) {
      clearInterval(runtime.intervalId)
      runtime.intervalId = null
    }
  }

  releaseGeneratorNotes (id) {
    const generator = this.getGenerator(id)
    const runtime = this.runtime.get(id)
    if (!runtime) return

    const trackId = generator?.trackId
    runtime.activeNotes.forEach((note) => {
      if (trackId != null) this.midiManager.noteOffTrack(trackId, note)
      if (this.midiOutEnabled) this.midiManager.sendGenerateNoteOff(note)
    })
    runtime.activeNotes = []

    if (trackId != null && !this.isTrackActive(trackId)) {
      this.midiManager.clearTrackNotes(trackId)
    }
  }

  releaseAllMidiOut () {
    this.runtime.forEach((runtime) => {
      runtime.activeNotes.forEach((note) => {
        this.midiManager.sendGenerateNoteOff(note)
      })
    })
  }

  randomRoot () {
    return Math.floor(Math.random() * (MAX_NOTE - MIN_NOTE + 1)) + MIN_NOTE
  }

  resolveVelocity (generator) {
    if (generator.velocityRandom <= 0) return generator.velocity
    const offset =
      Math.floor(Math.random() * (generator.velocityRandom * 2 + 1)) -
      generator.velocityRandom
    return Math.max(1, Math.min(127, generator.velocity + offset))
  }

  generateNotes (generator, root) {
    const step = INTERVALS[generator.intervalMode] ?? INTERVALS.fifth
    const notes = []
    for (let i = 0; i < generator.numberOfNotes; i++) {
      notes.push(Math.min(127, root + step * i))
    }
    return notes
  }

  isTrackPlayable (trackId) {
    const active = this.trackManager.getActiveTracks()
    return active.some((t) => t.id === trackId)
  }

  fire (generator) {
    const runtime = this.runtime.get(generator.id)
    if (!runtime || !generator.enabled) return

    const track = this.trackManager.getTrack(generator.trackId)
    if (!track?.luminode) return
    if (!this.isTrackPlayable(generator.trackId)) return

    const newNotes = this.generateNotes(generator, this.randomRoot())
    const velocity = this.resolveVelocity(generator)
    const prevNotes = runtime.activeNotes

    this.midiManager.ensureTrackNoteBucket(generator.trackId)

    // Overlap: note-on new first, then note-off removed — no empty gap for luminodes
    newNotes.forEach((note) => {
      this.midiManager.noteOnTrack(generator.trackId, note, velocity)
    })

    prevNotes.forEach((note) => {
      if (!newNotes.includes(note)) {
        this.midiManager.noteOffTrack(generator.trackId, note)
        if (this.midiOutEnabled) {
          this.midiManager.sendGenerateNoteOff(note)
        }
      }
    })

    if (this.midiOutEnabled) {
      newNotes.forEach((note) => {
        if (!prevNotes.includes(note)) {
          this.midiManager.sendGenerateNoteOn(note, velocity)
        }
      })
    }

    runtime.activeNotes = newNotes
  }
}
