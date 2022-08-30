import { ApplicationConfig } from './ApplicationConfig'

export class ApplicationConfigManager {
  private _config: ApplicationConfig

  constructor (config: ApplicationConfig) {
    this._config = config
  }

  get <T extends keyof ApplicationConfig>(name: T): ApplicationConfig[T] {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const configValue = this._config[name]
    if (configValue !== undefined ) return configValue
    const envValue = process.env[name]
    if (envValue !== undefined) {
      return envValue
    }
    throw new Error(`Cannot find config for '${name}'`)
  }
}
