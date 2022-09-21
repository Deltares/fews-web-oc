import { UserManagerSettings } from 'oidc-client-ts'

const publicPath = process.env.NODE_ENV === 'production'
  ? process.env.VUE_APP_PUBLIC_PATH
  : '/'

const baseUrl = window.location.origin + publicPath
const oidcSettings: UserManagerSettings = {
  authority: `${process.env.VUE_APP_AUTH_AUTHORITY}`,
  metadataUrl: `${process.env.VUE_APP_AUTH_METADATA_URL}`,
  client_id: `${process.env.VUE_APP_AUTH_ID}`,
  redirect_uri: `${baseUrl}auth/callback`,
  silent_redirect_uri: `${baseUrl}auth/silent`,
  response_type: `${process.env.VUE_APP_AUTH_TYPE}`,
  scope: `${process.env.VUE_APP_AUTH_SCOPE}`,
  post_logout_redirect_uri: `${baseUrl}auth/logout`,
  monitorSession: false,
  // sessionChecksEnabled: true
}

export default oidcSettings
