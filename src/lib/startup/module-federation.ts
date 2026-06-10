import { init } from '@module-federation/enhanced/runtime'
import { configManager } from '../../services/application-config'

export async function setupModuleFederation() {
  const manifestUrl = configManager.get('VITE_FEWS_WEBOC_MF_MANIFEST_URL')
  if (!manifestUrl) return

  console.log(`Loading manifest from: ${manifestUrl}`)

  const response = await fetch(manifestUrl)
  const manifestJson = await response.json()

  init(manifestJson)
}
