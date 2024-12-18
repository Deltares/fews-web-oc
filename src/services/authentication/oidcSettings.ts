import { UserManagerSettings } from 'oidc-client-ts'

export function getOidcSettings() {
  const baseUrl = window.location.origin + import.meta.env.BASE_URL
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
    automaticSilentRenew: true,
  }
  return oidcSettings
}
