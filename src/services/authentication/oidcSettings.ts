import { UserManagerSettings } from 'oidc-client-ts'

const publicPath =
  import.meta.env.NODE_ENV === 'production'
    ? import.meta.env.VITE_PUBLIC_PATH
    : '/'

const baseUrl = window.location.origin + publicPath
const oidcSettings: UserManagerSettings = {
  authority: `${import.meta.env.VITE_AUTH_AUTHORITY}`,
  metadataUrl: `${import.meta.env.VITE_AUTH_METADATA_URL}`,
  client_id: `${import.meta.env.VITE_AUTH_ID}`,
  redirect_uri: `${baseUrl}auth/callback`,
  silent_redirect_uri: `${baseUrl}auth/silent`,
  response_type: `code`,
  scope: `${import.meta.env.VITE_AUTH_SCOPE}`,
  post_logout_redirect_uri: `${baseUrl}auth/logout`,
  monitorSession: false,
  // sessionChecksEnabled: true
}

export default oidcSettings
