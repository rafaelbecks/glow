export class WindowBridge {
  constructor () {
    this.handlers = {}
    this.target = null
    window.addEventListener('message', (e) => this._onMessage(e))
  }

  connect (target) {
    this.target = target
  }

  send (type, payload = {}) {
    if (!this.target || this.target.closed) return
    this.target.postMessage({ __glow: true, type, payload }, '*')
  }

  on (type, handler) {
    if (!this.handlers[type]) this.handlers[type] = []
    this.handlers[type].push(handler)
  }

  isConnected () {
    return !!(this.target && !this.target.closed)
  }

  _onMessage ({ data }) {
    if (!data?.__glow) return
    ;(this.handlers[data.type] || []).forEach(h => h(data.payload))
  }
}
