/**
 * Classic File / View / Lab / Help menubar (same pattern as MUSGO).
 */

function menuIcon (name) {
  return `<ion-icon class="app-menu__icon" name="${name}" aria-hidden="true"></ion-icon>`
}

export function createAppMenu ({
  parent = document.getElementById('appMenuMount'),
  actions = {}
} = {}) {
  if (!parent) return { destroy () {}, show () {}, hide () {}, refresh () {} }

  const bar = document.createElement('nav')
  bar.className = 'app-menu'
  bar.setAttribute('aria-label', 'Application menu')

  const menus = [
    {
      id: 'file',
      label: 'File',
      items: [
        { id: 'new', label: 'New', shortcut: '⌘N', icon: 'add-outline' },
        { id: 'open', label: 'Open…', shortcut: '⌘O', icon: 'folder-open-outline' },
        { id: 'save', label: 'Save', shortcut: '⌘S', icon: 'save-outline' },
        { id: 'saveAs', label: 'Save As…', shortcut: '⇧⌘S', icon: 'download-outline' },
        { type: 'separator' },
        { id: 'exportSvg', label: 'Export SVG…', icon: 'code-slash-outline' },
        { id: 'exportPng', label: 'Export PNG…', shortcut: '⌘P', icon: 'image-outline' }
      ]
    },
    {
      id: 'view',
      label: 'View',
      items: [
        {
          id: 'tools',
          label: 'Tools',
          type: 'checkbox',
          icon: 'cube-outline',
          checked: () => actions.isTools?.()
        },
        {
          id: 'mixer',
          label: 'Mixer',
          type: 'checkbox',
          icon: 'layers-outline',
          checked: () => actions.isMixer?.()
        },
        {
          id: 'separateScreen',
          label: 'Separate Screen',
          type: 'checkbox',
          icon: 'browsers-outline',
          checked: () => actions.isSeparateScreen?.()
        },
        { type: 'separator' },
        {
          id: 'uiChrome',
          label: 'Interface',
          type: 'checkbox',
          shortcut: '⌘I',
          icon: 'eye-outline',
          checked: () => actions.isUiChrome?.()
        }
      ]
    },
    {
      id: 'lab',
      label: 'Lab',
      items: [
        { id: 'luminodeLab', label: 'Luminode Lab…', icon: 'flask-outline' }
      ]
    },
    {
      id: 'help',
      label: 'Help',
      items: [
        { id: 'about', label: 'About GLOW…', icon: 'help-circle-outline' }
      ]
    }
  ]

  let openMenuId = null
  const menuRoots = new Map()

  function closeAll () {
    openMenuId = null
    for (const root of menuRoots.values()) {
      root.classList.remove('is-open')
      root.querySelector('.app-menu__trigger')?.setAttribute('aria-expanded', 'false')
    }
  }

  function openMenu (id) {
    if (openMenuId === id) {
      closeAll()
      return
    }
    closeAll()
    openMenuId = id
    const root = menuRoots.get(id)
    if (!root) return
    root.classList.add('is-open')
    root.querySelector('.app-menu__trigger')?.setAttribute('aria-expanded', 'true')
    refreshCheckboxes(root)
  }

  function refreshCheckboxes (root) {
    root.querySelectorAll('[data-check]').forEach((el) => {
      const itemId = el.dataset.action
      const menu = menus.find((m) => m.id === root.dataset.menu)
      const item = menu?.items.find((i) => i.id === itemId)
      const on = Boolean(item?.checked?.())
      el.classList.toggle('is-checked', on)
      el.setAttribute('aria-checked', on ? 'true' : 'false')
    })
  }

  function refresh () {
    for (const root of menuRoots.values()) refreshCheckboxes(root)
  }

  async function runAction (id) {
    closeAll()
    const fn = actions[id]
    if (!fn) return
    try {
      await fn()
    } catch (err) {
      if (
        err?.name === 'AbortError' ||
        err?.message === 'File picker cancelled.' ||
        err?.message === 'No file selected.'
      ) {
        return
      }
      console.error(`[menu] ${id} failed`, err)
    }
    refresh()
  }

  for (const menu of menus) {
    const root = document.createElement('div')
    root.className = 'app-menu__item'
    root.dataset.menu = menu.id

    const trigger = document.createElement('button')
    trigger.type = 'button'
    trigger.className = 'app-menu__trigger'
    trigger.textContent = menu.label
    trigger.setAttribute('aria-haspopup', 'true')
    trigger.setAttribute('aria-expanded', 'false')
    trigger.addEventListener('click', (ev) => {
      ev.stopPropagation()
      openMenu(menu.id)
    })
    trigger.addEventListener('mouseenter', () => {
      if (openMenuId != null && openMenuId !== menu.id) openMenu(menu.id)
    })

    const panel = document.createElement('div')
    panel.className = 'app-menu__dropdown'
    panel.setAttribute('role', 'menu')

    for (const item of menu.items) {
      if (item.type === 'separator') {
        const sep = document.createElement('div')
        sep.className = 'app-menu__separator'
        sep.setAttribute('role', 'separator')
        panel.appendChild(sep)
        continue
      }

      const btn = document.createElement('button')
      btn.type = 'button'
      btn.className = 'app-menu__action'
      btn.setAttribute('role', 'menuitem')
      btn.dataset.action = item.id
      const iconHtml = item.icon
        ? menuIcon(item.icon)
        : '<span class="app-menu__icon" aria-hidden="true"></span>'
      if (item.type === 'checkbox') {
        btn.dataset.check = '1'
        btn.setAttribute('role', 'menuitemcheckbox')
        btn.innerHTML = `${iconHtml}<span class="app-menu__label">${item.label}</span>${
          item.shortcut
            ? `<span class="app-menu__shortcut">${item.shortcut}</span>`
            : ''
        }<span class="app-menu__check" aria-hidden="true"></span>`
      } else {
        btn.innerHTML = `${iconHtml}<span class="app-menu__label">${item.label}</span>${
          item.shortcut
            ? `<span class="app-menu__shortcut">${item.shortcut}</span>`
            : ''
        }`
      }
      btn.addEventListener('click', (ev) => {
        ev.stopPropagation()
        runAction(item.id)
      })
      panel.appendChild(btn)
    }

    root.appendChild(trigger)
    root.appendChild(panel)
    bar.appendChild(root)
    menuRoots.set(menu.id, root)
  }

  function onDocClick () {
    closeAll()
  }

  function onKeyDown (ev) {
    if (ev.key === 'Escape') closeAll()
  }

  document.addEventListener('click', onDocClick)
  window.addEventListener('keydown', onKeyDown)

  parent.querySelector('.app-menu')?.remove()
  parent.appendChild(bar)

  return {
    close: closeAll,
    refresh,
    show () {
      parent.style.display = 'flex'
    },
    hide () {
      closeAll()
      parent.style.display = 'none'
    },
    destroy () {
      document.removeEventListener('click', onDocClick)
      window.removeEventListener('keydown', onKeyDown)
      bar.remove()
    }
  }
}
