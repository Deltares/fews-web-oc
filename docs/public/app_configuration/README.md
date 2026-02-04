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
|  `VITE_APP_NAME`                    | Set the application name shown on the Login screen and browser title. Note this setting is overruled by the `<title>` configured in the `WebOperatorClient.xml` in the FEWS configuration. This might change in the future. |
|  `VITE_APP_MANIFEST_URL`            | Use a custom PWA manifest. The manifest file and referenced assets must be placed in the web resources of the FEWS config. |  
| `VITE_LOGIN_STYLESHEET_URL`         | Use a custom stylesheet for the Login screen. The stylesheet and referenced assets must be placed in the web resources of the FEWS config.  |
| `VITE_LOGIN_BUTTON_PROPS` | An object or JSON string containing properties that are passed to the login button. See https://vuetifyjs.com/en/api/v-btn/#props for which property can be set. Helpful properties are `"prependIcon"`, `"text"`, `"appendIcon"` and `"color"`. |


## Progressive Web Application Manifest File

The standard build of the Web OC includes an `app.webmanifest` file, a Progressive Web Application (PWA) manifest file. This enables installing Web OC as a standalone application on Windows, macOS, iOS, and Android. The file can be customized to match your company style and branding. You can do this in one of two ways:

1. Edit the `app.webmanifest` file directly and add your icon files to the webserver hosting the Web OC.
2. Configure the `VITE_APP_MANIFEST_URL` and place the manifest file along with the referenced icon files in the `WebResourceFiles` folder of the FEWS configuration. Refer to the [Delft-FEWS Configuration Guide](https://publicwiki.deltares.nl/display/FEWSDOC/Configuring+Delft-FEWS+-+Configuration+Guide) for more details.

For additional information, see the [MDN Web Docs](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Manifest). It is recommended to check browser warnings when editing the manifest file, as incorrect settings or missing icons can break the Progressive Web Application functionality. 

Ensure the correct Content Security Policy is applied. Refer to the [Content Security Policy](https://deltares.github.io/fews-web-oc/deployments/#content-security-policy-csp-headers) documentation. If the manifest file is hosted on a different domain, the `start_url` property must include the fully qualified domain name of the server hosting the Web OC.
