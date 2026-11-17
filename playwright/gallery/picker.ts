import './picker.css'
import vuetify from '../../src/plugins/vuetify'

type StoryModules = Record<string, () => Promise<unknown>>
type Mount = (params: { story: string }) => Promise<void>

/**
 * Story picker for browsing the gallery by hand. Stories are listed per file,
 * the exports of a file are loaded when it is opened. The selected story is
 * kept in the URL (?story=reports/DynamicReportContent/Isolated), so it can be
 * linked and survives a reload. The theme (?theme=dark) and the default WebOC
 * style sheet (?stylesheet=off) are kept in the URL as well.
 */
export function createStoryPicker(
  stories: StoryModules,
  id: (file: string) => string,
  mount: Mount,
) {
  const nav = document.createElement('nav')
  nav.className = 'gallery-picker'
  const filter = document.createElement('input')
  filter.type = 'search'
  filter.placeholder = 'Filter stories'
  filter.className = 'gallery-picker__filter'
  nav.appendChild(filter)
  nav.appendChild(createSettings())

  const list = document.createElement('div')
  nav.appendChild(list)
  document.body.prepend(nav)
  document.body.classList.add('gallery-picker--visible')

  const links = new Map<string, HTMLAnchorElement>()

  async function select(storyId: string) {
    links.forEach((link, linkId) =>
      link.classList.toggle(
        'gallery-picker__story--active',
        linkId === storyId,
      ),
    )
    setSearchParam('story', storyId)
    document.title = `${storyId} - Component Gallery`
    try {
      await mount({ story: storyId })
    } catch (error) {
      console.error(error)
    }
  }

  async function loadExports(file: string, group: HTMLElement) {
    if (group.dataset.loaded) return
    group.dataset.loaded = 'true'
    const module = (await stories[file]()) as Record<string, unknown>
    for (const name of Object.keys(module)) {
      const storyId = `${id(file)}/${name}`
      const link = document.createElement('a')
      link.className = 'gallery-picker__story'
      link.textContent = name
      link.href = `?story=${encodeURIComponent(storyId)}`
      link.addEventListener('click', (event) => {
        event.preventDefault()
        select(storyId)
      })
      links.set(storyId, link)
      group.appendChild(link)
    }
  }

  const groups = Object.keys(stories)
    .sort((a, b) => id(a).localeCompare(id(b)))
    .map((file) => {
      const details = document.createElement('details')
      const summary = document.createElement('summary')
      summary.textContent = id(file)
      details.appendChild(summary)
      details.addEventListener('toggle', () => {
        if (details.open) loadExports(file, details)
      })
      list.appendChild(details)
      return { file, details }
    })

  filter.addEventListener('input', () => {
    const query = filter.value.trim().toLowerCase()
    for (const { file, details } of groups) {
      details.hidden = !id(file).toLowerCase().includes(query)
    }
  })

  const initialStory = new URL(window.location.href).searchParams.get('story')
  if (initialStory) {
    const path = initialStory.slice(0, initialStory.lastIndexOf('/'))
    const group = groups.find(
      ({ file }) => id(file) === path || id(file).endsWith('/' + path),
    )
    if (group) {
      group.details.open = true
      loadExports(group.file, group.details).then(() => select(initialStory))
    } else {
      select(initialStory)
    }
  }
}

type Theme = 'light' | 'dark' | 'system'

const prefersDark = window.matchMedia('(prefers-color-scheme: dark)')

function createSettings() {
  const settings = document.createElement('div')
  settings.className = 'gallery-picker__settings'

  const theme = document.createElement('select')
  theme.ariaLabel = 'Theme'
  for (const value of ['light', 'dark', 'system'] satisfies Theme[]) {
    theme.add(new Option(value[0].toUpperCase() + value.slice(1), value))
  }
  theme.value = getSearchParam('theme', 'light')
  theme.addEventListener('change', () => {
    setSearchParam('theme', theme.value)
    applyTheme(theme.value as Theme)
  })
  prefersDark.addEventListener('change', () => applyTheme(theme.value as Theme))
  applyTheme(theme.value as Theme)

  const styleSheetLabel = document.createElement('label')
  const styleSheet = document.createElement('input')
  styleSheet.type = 'checkbox'
  styleSheet.checked = getSearchParam('stylesheet', 'on') === 'on'
  styleSheet.addEventListener('change', () => {
    setSearchParam('stylesheet', styleSheet.checked ? 'on' : 'off')
    applyWebOcStyleSheet(styleSheet.checked)
  })
  applyWebOcStyleSheet(styleSheet.checked)
  styleSheetLabel.append(styleSheet, ' WebOC style sheet')

  settings.append(theme, styleSheetLabel)
  return settings
}

/**
 * Apply the theme like the WebOC does: the Vuetify theme, and the "dark"
 * class on <html> that is set by VueUse. The gallery has no <v-app>, so the
 * theme class is set on <body>.
 */
function applyTheme(theme: Theme) {
  const dark = theme === 'dark' || (theme === 'system' && prefersDark.matches)
  const name = dark ? 'dark' : 'light'
  vuetify.theme.change(name)
  document.documentElement.classList.toggle('dark', dark)
  document.body.classList.remove('v-theme--light', 'v-theme--dark')
  document.body.classList.add(`v-theme--${name}`)
}

/**
 * The default WebOC style sheet, used by the WebOC when no customStyleSheet
 * is configured.
 */
function applyWebOcStyleSheet(enabled: boolean) {
  const id = 'gallery-weboc-style-sheet'
  const existing = document.getElementById(id)
  if (!enabled) {
    existing?.remove()
    return
  }
  if (existing) return
  const link = document.createElement('link')
  link.id = id
  link.rel = 'stylesheet'
  link.href = `${import.meta.env.BASE_URL}weboc-default-style.css`
  document.head.appendChild(link)
}

function getSearchParam(name: string, defaultValue: string) {
  return new URL(window.location.href).searchParams.get(name) ?? defaultValue
}

function setSearchParam(name: string, value: string) {
  const url = new URL(window.location.href)
  url.searchParams.set(name, value)
  history.replaceState(null, '', url)
}
