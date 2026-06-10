import { init } from '@module-federation/enhanced/runtime'
import { configManager } from '../../services/application-config'

export async function setupModuleFederation() {
  const remoteManifest = configManager.get('VITE_FEWS_WEBOC_MF_MANIFEST_URL')
  if (!remoteManifest) return

  console.log(`Loading remote manifest from: ${remoteManifest}`)

  const initOptions = {
    name: 'weboc-micro-frontend',
    remotes: [
      {
        // mf-manifest.json is a file type generated in the new version of Module Federation build tools, providing richer functionality compared to remoteEntry
        // Preloading depends on the use of the mf-manifest.json file type
        name: 'mdba-micro-frontend',
        entry: remoteManifest,
      },
    ],
  }
  await init(initOptions)
}
