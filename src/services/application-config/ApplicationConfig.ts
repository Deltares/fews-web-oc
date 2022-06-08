export enum RequestHeaderAuthorization {
  BEARER = 'bearer',
  OFF = 'off',
}

export interface ApplicationConfig {
  VUE_APP_FEWS_WEBSERVICES_URL: string;
  VUE_APP_REQEUST_HEADER_AUTHORIZATION: RequestHeaderAuthorization;
}
