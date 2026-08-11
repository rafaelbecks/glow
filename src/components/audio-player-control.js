/**
 * Lightweight audio player control (Tweakpane-styled).
 * Replaces tweakpane-plugin-audio-player, which targets Tweakpane v3 and
 * throws notcompatible on v4 registerPlugin.
 */

const PLAYER_STYLE_ID = 'glow-audio-player-style'

const PLAYER_CSS = `
.glow-plyr {
  display: flex;
  width: 100%;
  align-items: center;
  gap: 0;
  min-height: var(--bld-us, 24px);
}
.glow-plyr_w {
  flex: 2;
  display: flex;
  align-items: center;
  min-width: 0;
}
.glow-plyr_wb {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  margin-left: 6px;
  cursor: pointer;
}
.glow-plyr_wt {
  flex: 0 0 auto;
  margin-left: 4px;
}
.glow-plyr_b.play {
  width: 12px;
  height: 12px;
  box-sizing: border-box;
  border-style: solid;
  border-width: 6px 0 6px 12px;
  border-color: transparent transparent transparent var(--in-fg, #ddd);
}
.glow-plyr_b.pause {
  border-style: double;
  border-width: 0 0 0 10px;
}
.glow-plyr_s {
  flex: 3;
  min-width: 0;
  padding: 0 4px;
}
.glow-plyr_s input[type="range"] {
  width: 100%;
  margin: 0;
  accent-color: var(--in-fg, #ddd);
  cursor: pointer;
}
.glow-plyr_t {
  box-sizing: border-box;
  color: var(--lbl-fg, #aaa);
  font-family: inherit;
  height: var(--bld-us, 24px);
  line-height: var(--bld-us, 24px);
  min-width: 0;
  padding: 0 4px;
  text-align: right;
  font-size: 11px;
}
.glow-plyr.is-disabled {
  opacity: 0.45;
  pointer-events: none;
}
`

function ensurePlayerStyles () {
  if (typeof document === 'undefined') return
  if (document.getElementById(PLAYER_STYLE_ID)) return
  const style = document.createElement('style')
  style.id = PLAYER_STYLE_ID
  style.textContent = PLAYER_CSS
  document.head.appendChild(style)
}

function formatTime (duration) {
  const safe = Number.isFinite(duration) ? Math.max(0, duration) : 0
  const min = Math.floor(safe / 60)
  const sec = Math.floor(safe % 60)
  return `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
}

/**
 * @param {HTMLMediaElement} audio
 * @param {{ disabled?: boolean }} [options]
 * @returns {{ element: HTMLElement, dispose: () => void, setDisabled: (boolean) => void }}
 */
export function createAudioPlayerControl (audio, options = {}) {
  ensurePlayerStyles()

  const root = document.createElement('div')
  root.className = 'glow-plyr'
  if (options.disabled) root.classList.add('is-disabled')

  const wrapBtnSld = document.createElement('div')
  wrapBtnSld.className = 'glow-plyr_w'
  root.appendChild(wrapBtnSld)

  const wrapBtn = document.createElement('div')
  wrapBtn.className = 'glow-plyr_wb'
  wrapBtn.title = 'Play / Pause'
  wrapBtnSld.appendChild(wrapBtn)

  const btn = document.createElement('div')
  btn.className = 'glow-plyr_b play'
  wrapBtn.appendChild(btn)

  const sliderWrap = document.createElement('div')
  sliderWrap.className = 'glow-plyr_s'
  wrapBtnSld.appendChild(sliderWrap)

  const slider = document.createElement('input')
  slider.type = 'range'
  slider.min = '0'
  slider.max = '1000'
  slider.value = '0'
  slider.step = '1'
  sliderWrap.appendChild(slider)

  const wrapTxt = document.createElement('div')
  wrapTxt.className = 'glow-plyr_wt'
  root.appendChild(wrapTxt)

  const elapsed = document.createElement('div')
  elapsed.className = 'glow-plyr_t'
  elapsed.textContent = '00:00'
  wrapTxt.appendChild(elapsed)

  let scrubbing = false

  const syncButton = () => {
    if (audio.paused) btn.classList.remove('pause')
    else btn.classList.add('pause')
  }

  const syncTime = () => {
    if (scrubbing) return
    const duration = audio.duration
    const ratio =
      duration && Number.isFinite(duration) && duration > 0
        ? audio.currentTime / duration
        : 0
    slider.value = String(Math.round(ratio * 1000))
    elapsed.textContent = formatTime(audio.currentTime || 0)
  }

  const onPlayPause = async () => {
    try {
      if (audio.paused) await audio.play()
      else audio.pause()
    } catch (error) {
      console.warn('Audio playback failed:', error)
    }
  }

  const onSliderInput = () => {
    scrubbing = true
    const duration = audio.duration
    if (duration && Number.isFinite(duration) && duration > 0) {
      const t = Number(slider.value) / 1000
      audio.currentTime = duration * t
      elapsed.textContent = formatTime(audio.currentTime)
    }
  }

  const onSliderChange = () => {
    scrubbing = false
    syncTime()
  }

  wrapBtn.addEventListener('click', onPlayPause)
  slider.addEventListener('input', onSliderInput)
  slider.addEventListener('change', onSliderChange)
  audio.addEventListener('play', syncButton)
  audio.addEventListener('pause', syncButton)
  audio.addEventListener('ended', syncButton)
  audio.addEventListener('timeupdate', syncTime)
  audio.addEventListener('loadedmetadata', syncTime)

  syncButton()
  syncTime()

  return {
    element: root,
    setDisabled (disabled) {
      root.classList.toggle('is-disabled', !!disabled)
    },
    dispose () {
      wrapBtn.removeEventListener('click', onPlayPause)
      slider.removeEventListener('input', onSliderInput)
      slider.removeEventListener('change', onSliderChange)
      audio.removeEventListener('play', syncButton)
      audio.removeEventListener('pause', syncButton)
      audio.removeEventListener('ended', syncButton)
      audio.removeEventListener('timeupdate', syncTime)
      audio.removeEventListener('loadedmetadata', syncTime)
      if (root.parentNode) root.parentNode.removeChild(root)
    }
  }
}
