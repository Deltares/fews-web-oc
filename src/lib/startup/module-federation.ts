import type { App as VueApp } from 'vue'
import { configManager } from '@/services/application-config'
import moduleFederationPlugin from '@/plugins/moduleFederation'

export async function setupModuleFederation(app: VueApp<Element>) {
  const manifestUrl = configManager.get('VITE_FEWS_WEBOC_MF_MANIFEST_URL')
  if (!manifestUrl) return

  console.log(`Loading manifest from: ${manifestUrl}`)

  const response = await fetch(manifestUrl)
  const manifestJson = await response.json()

  app.use(moduleFederationPlugin, manifestJson)
}
