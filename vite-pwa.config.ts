import { PiWebserviceProvider } from '@deltares/fews-pi-requests'
import fs from 'fs'
import http from 'http'
import https from 'https'
import { VitePWA } from 'vite-plugin-pwa'

function downloadImage(url: string, location: string) {
  const isHttps = url.startsWith('https')
  const client = isHttps ? https : http

  return new Promise((resolve, reject) => {
    client.get(url, (res) => {
      res
        .pipe(fs.createWriteStream(location))
        .on('error', reject)
        .once('close', () => resolve(location))
    })
  })
}

async function getWebOcConfig(env: Record<string, string>) {
  try {
    const provider = new PiWebserviceProvider(env.VITE_FEWS_WEBSERVICES_URL)
    const response = await provider.getWebOcConfiguration()
    const config = response?.general
    if (!config) return

    if (config.icons?.logo) {
      const iconUrl = provider.resourcesStaticUrl(config.icons.logo).toString()
      const iconLocation = `./public/${config.icons.logo}`
      await downloadImage(iconUrl, iconLocation)
      config.icons.logo = iconLocation
    }

    return config
  } catch (error) {
    console.error(error)
  }
}

export default async function getVitePWAPlugin(
  env: Record<string, string>,
  getFromRemote: boolean,
) {
  const webOcConfig = getFromRemote ? await getWebOcConfig(env) : undefined

  return VitePWA({
    registerType: 'autoUpdate',
    injectRegister: false,

    manifest: {
      name: webOcConfig?.title ?? 'FEWS WebOC',
      short_name: 'WebOC',
      description: webOcConfig?.title ?? 'FEWS Web Operator Client',
      theme_color: '#080c80',
    },

    pwaAssets: {
      image: webOcConfig?.icons?.logo,
      overrideManifestIcons: webOcConfig?.icons.logo !== undefined,
    },

    workbox: {
      globPatterns: ['**/*.{js,css,html,svg,png,ico}'],
      cleanupOutdatedCaches: true,
      clientsClaim: true,
    },

    devOptions: {
      enabled: true,
      navigateFallback: 'index.html',
      suppressWarnings: true,
      type: 'module',
    },
  })
}
