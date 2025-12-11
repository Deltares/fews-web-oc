## Application Configuration

The application configuration is stored in the `.env` or the `public/app-config.json` file. All settings are provided as a key-value pair.
Settings in the `.env` file are parsed on build time, while settings in the `app-config.json` are handled on run-time.
The following settings can be provided:

| Key                                 | Description                                                                                                           |
| ----------------------------------- |-----------------------------------------------------------------------------------------------------------------------|
| `VITE_FEWS_WEBSERVICES_URL`         | Url of the FewsWebServices, e.g. "https://my-server/FewsWebServices"                                                  |
| `VITE_REQUEST_HEADER_AUTHORIZATION` | 'Bearer': pass OIDC `access_token` as bearer for request to the FewsWebServices                                       |
|                                     | 'Off': no Authorization request header                                                                                |
| `VITE_AUTH_AUTHORITY`               | Url of the OIDC authority, e.g. "https://login.microsoftonline.com/MYTENANTID/".                                      |
|                                     | If not configured the web oc can be accessed without authentication.                                                  |
| `VITE_AUTH_METADATA_URL`            | Url of the OIDC meta data, e.g. "https://login.microsoftonline.com/MYTENANTID/v2.0/.well-known/openid-configuration". |
| `VITE_AUTH_SCOPE`                   | Scope, e.g. "openid profile email Offline_Access api://myclientid/Delft-FEWSWebServices".                             |
| `VITE_MAPBOX_TOKEN`                 | Mapbox token. Can be retrieved from: https://account.mapbox.com/access-tokens. Optional since v1.1.0.                                       |
|  `VITE_APP_NAME` | Set the application name shown on the Login screen and browser title. Note this setting is overruled by the `<title>` configured in the `WebOperatorClient.xml` in the FEWS configuration. This might change in the future. |  
| `VITE_LOGIN_STYLESHEET_URL`         | Use a custom stylesheet for the Login screen. The stylesheet and referenced assets must be placed in the web resources of the FEWS config.  |
| `VITE_LOGIN_BUTTON_PROPS` | An object or JSON string containing properties that are passed to the login button. See https://vuetifyjs.com/en/api/v-btn/#props for which property can be set. Helpful properties are `"prependIcon"`, `"text"`, `"appendIcon"` and `"color"`. |