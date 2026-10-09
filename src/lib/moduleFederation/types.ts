import type { WebOCMicroFrontEndsResponse } from '@deltares/fews-pi-requests'

export interface ModuleFederationOptions {
  manifestUrl: string
  baseUrl: string
}

export interface MicroFrontendRemote {
  name: string
  entry: string
}

export interface MicroFrontendRegistry {
  config: WebOCMicroFrontEndsResponse
  options: ModuleFederationOptions
  remotes: MicroFrontendRemote[]
}
