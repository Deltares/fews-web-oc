import { createApp, h, shallowRef, type App, type Component } from 'vue'
import vuetify from '../../src/plugins/vuetify'
import { i18n, setI18nLanguage } from '../../src/plugins/i18n'
import { createPinia, setActivePinia } from 'pinia'

const pinia = createPinia()

// Resolve stories via import.meta.glob
const stories = import.meta.glob('../../src/**/*.story.{ts,js,vue}', {
  eager: false,
})
const id = (f: string) =>
  f.replace(/^(\.\.\/)+src\//, '').replace(/\.story\.\w+$/, '')

async function resolve(storyId: string) {
  const sep = storyId.lastIndexOf('/')
  const [path, name] = [storyId.slice(0, sep), storyId.slice(sep + 1)]
  const file = Object.keys(stories).find(
    (f) => id(f) === path || id(f).endsWith('/' + path),
  )
  const mod =
    file && ((await stories[file]()) as Record<string, any> | undefined)
  return mod?.[name] ?? mod?.default
}

const story = shallowRef<Component | null>(null)
const props = shallowRef<Record<string, any>>({})
const host = {
  render: () => (story.value ? h(story.value, props.value) : null),
}
let app: App | undefined

;(window as any).mount = async ({
  story: storyId,
  props: nextProps,
}: {
  story: string
  props?: Record<string, any>
}) => {
  setActivePinia(pinia)
  const resolved = await resolve(storyId)
  if (!resolved) throw new Error(`Unknown story: ${storyId}`)
  story.value = resolved
  props.value = nextProps ?? {}
  if (!app) {
    // Load the messages like the WebOC does at startup, so components show
    // their translated texts instead of the message keys
    await setI18nLanguage(i18n, 'en-GB')
    app = createApp(host)
    app.use(vuetify)
    app.use(i18n)
    app.use(pinia)
    app.mount('#root')
  }
}

;(window as any).unmount = async () => {
  app?.unmount()
  app = undefined
  story.value = null
  props.value = {}
}

// Playwright sets navigator.webdriver, only show the picker when browsing by hand
if (!navigator.webdriver) {
  import('./picker').then(({ createStoryPicker }) =>
    createStoryPicker(stories, id, (window as any).mount),
  )
}
