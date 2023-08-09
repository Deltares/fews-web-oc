export enum RequestHeaderAuthorization {
  BEARER = 'Bearer',
  OFF = 'Off',
}

export type ApplicationConfig = {
  VITE_APP_AUTH_SCOPE: string;
  VITE_APP_AUTH_AUTHORITY: string;
  VITE_APP_FEWS_ARCHIVE_WEBSERVICES_URL: string;
  VITE_APP_AUTH_METADATA_URL: string;
  VITE_APP_AUTH_ID: string;
  VITE_APP_REQUEST_HEADER_AUTHORIZATION: RequestHeaderAuthorization;
  VITE_APP_FEWS_WEBSERVICES_URL: string;
  VITE_APP_MAPBOX_TOKEN: string;
}
