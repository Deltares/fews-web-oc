import Oidc from 'oidc-client'

const oidcSettings = {
  authority: `${process.env.VUE_APP_AUTH_AUTHORITY}`,
  client_id: `${process.env.VUE_APP_AUTH_ID}`,
  redirect_uri: `${window.location.origin}/auth/callback`,
  registration_uri: `${process.env.VUE_APP_AUTH_AUTHORITY}/protocol/openid-connect/registrations`,
  silent_redirect_uri: `${window.location.origin}/auth/silent`,
  response_type: `${process.env.VUE_APP_AUTH_TYPE}`,
  scope: `${process.env.VUE_APP_AUTH_SCOPE}`,
  post_logout_redirect_uri: `${window.location.origin}/auth/logout`,
  userStore: new Oidc.WebStorageStateStore({ store: window.localStorage }),
  monitorSession: false,
  sessionChecksEnabled: true
}

export default oidcSettings
