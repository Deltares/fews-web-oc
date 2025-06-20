export enum RequestHeaderAuthorization {
  BEARER = 'Bearer',
  OFF = 'Off',
}

export type ApplicationConfig = {
  VITE_AUTH_SCOPE: string
  VITE_AUTH_AUTHORITY: string
  VITE_FEWS_ARCHIVE_WEBSERVICES_URL: string
  VITE_AUTH_METADATA_URL: string
  VITE_AUTH_ID: string
  VITE_REQUEST_HEADER_AUTHORIZATION: RequestHeaderAuthorization
  VITE_FEWS_WEBSERVICES_URL: string
  VITE_FEWS_WEBOC_MF_MANIFEST_URL: string
}
