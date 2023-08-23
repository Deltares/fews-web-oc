import type { ApplicationConfig } from './services/application-config/ApplicationConfig.ts'

declare global {
  namespace NodeJS {
    interface ProcessEnv extends ApplicationConfig {
      NODE_ENV: 'development' | 'production'
    }
  }
}
