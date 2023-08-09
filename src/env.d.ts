/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_TITLE: string
  readonly VITE_APP_AUTH_SCOPE: string;
  readonly VITE_APP_AUTH_AUTHORITY: string;
  readonly VITE_APP_FEWS_ARCHIVE_WEBSERVICES_URL: string;
  readonly VITE_APP_AUTH_METADATA_URL: string;
  readonly VITE_APP_AUTH_ID: string;
  readonly VITE_APP_REQUEST_HEADER_AUTHORIZATION: RequestHeaderAuthorization;
  readonly VITE_APP_FEWS_WEBSERVICES_URL: string;
  readonly VITE_APP_MAPBOX_TOKEN: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
