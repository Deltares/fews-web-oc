import type { ApplicationConfig } from './services/application-config/ApplicationConfig.ts'

declare global {
  interface Window {
    __e2eLocationMap?: {
      setZoom(zoom: number): void
      hasLocation(id: string): Promise<boolean | undefined>
    }
  }

  namespace NodeJS {
    interface ProcessEnv extends ApplicationConfig {
      NODE_ENV: 'development' | 'production'
    }
  }
}
