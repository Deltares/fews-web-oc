import Oidc from 'oidc-client'

const oidcSettings = {
  authority: `${process.env.VUE_APP_AUTH_AUTHORITY}`,
  client_id: `${process.env.VUE_APP_AUTH_ID}`,
  client_secret: '9e1d9c1b-f31c-4679-ad47-1765c7d72356',
  redirect_uri: `${window.location.origin}`,
  registration_uri: `${process.env.VUE_APP_AUTH_AUTHORITY}/protocol/openid-connect/registrations`,
  silent_redirect_uri: `${window.location.origin}/auth/silent`,
  // response_type: `${process.env.VUE_APP_AUTH_TYPE}`,
  response_type: 'code',
  scope: `${process.env.VUE_APP_AUTH_SCOPE}`,
  post_logout_redirect_uri: `${window.location.origin}/auth/logout`,
  userStore: new Oidc.WebStorageStateStore({ store: window.localStorage }),
  monitorSession: false,
  sessionChecksEnabled: true
}

// const oidcSettings = {
//   authorization_endpoint: `${process.env.VUE_APP_AUTH_AUTHORITY}/oauth/v2.0/authorize`,
//   token_endpoint: `${process.env.VUE_APP_AUTH_AUTHORITY}/oauth/v2.0/token`,
//   client_id: `${process.env.VUE_APP_AUTH_ID}`,
//   redirect_uri: `${window.location.origin}/auth/callback`,
//   registration_uri: `${process.env.VUE_APP_AUTH_AUTHORITY}/protocol/openid-connect/registrations`,
//   silent_redirect_uri: `${window.location.origin}/auth/silent`,
//   // response_type: `${process.env.VUE_APP_AUTH_TYPE}`,
//   response_mode: 'form_post',
//   response_type: 'code',
//   scope: `${process.env.VUE_APP_AUTH_SCOPE}`,
//   post_logout_redirect_uri: `${window.location.origin}/auth/logout`,
//   userStore: new Oidc.WebStorageStateStore({ store: window.localStorage })
// }

export default oidcSettings
