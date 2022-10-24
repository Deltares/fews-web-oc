export enum RequestHeaderAuthorization {
  BEARER = 'Bearer',
  OFF = 'Off',
}

export type ApplicationConfig = {
  VUE_APP_FEWS_WEBSERVICES_URL: string;
  VUE_APP_AUTH_SCOPE: string;
  VUE_APP_REQUEST_HEADER_AUTHORIZATION: RequestHeaderAuthorization;
  VUE_APP_MAPBOX_TOKEN: string;
  VUE_APP_AUTH_AUTHORITY: string;
  VUE_APP_AUTH_METADATA_URL: string;
  VUE_APP_AUTH_ID: string;
}
