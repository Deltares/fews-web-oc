export enum RequestHeaderAuthorization {
  BEARER = 'Bearer',
  OFF = 'Off',
}

export type ApplicationConfig = {
  VITE_APP_NAME: string
  VITE_AUTH_AUTHORITY: string
  VITE_AUTH_ID: string
  VITE_AUTH_METADATA_URL: string
  VITE_AUTH_SCOPE: string
  VITE_FEWS_ARCHIVE_WEBSERVICES_URL: string
  VITE_FEWS_WEBSERVICES_URL: string
  LOCALE: string
  VITE_LOGIN_PROVIDER_LABEL: string
  VITE_LOGIN_PROVIDER_APPEND_ICON: string
  VITE_LOGIN_PROVIDER_PREPEND_ICON: string
  VITE_REQUEST_HEADER_AUTHORIZATION: RequestHeaderAuthorization
}
