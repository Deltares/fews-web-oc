export enum RequestHeaderAuthorization {
  BEARER = 'Bearer',
  OFF = 'Off',
}

export type ApplicationConfig = {
  VUE_APP_FEWS_WEBSERVICES_URL: string;
  VUE_APP_REQEUST_HEADER_AUTHORIZATION: RequestHeaderAuthorization;
}
