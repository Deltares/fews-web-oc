import { ApplicationConfig } from './ApplicationConfig'

export class ApplicationConfigManager {
  private _config: ApplicationConfig

  constructor (config: ApplicationConfig) {
    this._config = config
  }

  get<T> (name: keyof ApplicationConfig): T {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const value = process.env[name] || this._config[name]
    if (value !== undefined) {
      return process.env[name] || this._config[name]
    } else {
      throw new Error(`Cannot find config for '${name}'`)
    }
  }
}
