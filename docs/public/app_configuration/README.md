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

## Styling

By default the Web OC loads the `weboc-default-style.css` which can be found in the root directory of a Web OC build.
Three more style sheets with font specification, chart styles and specific css overruling Vuetify component styles are imported by this file.
In the following section a number of css variables define a number of colors used by the Web OC in normal (light) and dark mode.

```css
@import './fonts/exo-2/fonts.css';
@import './default-styles.css';
@import './vuetify-overrule.css';

:root {
  --font-family: 'Exo 2', sans-serif;
  --theme-color: white;
  --contrast-color: black;
  --canvas-fill: rgb(223, 223, 223);
  --weboc-app-bar-bg-color: #080c80;
}

.dark {
  --contrast-color: rgb(255, 255, 255);
  --theme-color: black;
  --canvas-fill: rgb(54, 54, 54);
}
```

Create a copy of the `weboc-default-style.css` and change the line in the `WebOperatorClient.xml` file to point to the new file:
```xml
<customStyleSheet>weboc-default-style.css</customStyleSheet>
```
See [Web OC Delft-FEWS configuration ](configuration/) for more information on the `WebOperatorClient.xml` file.

### Changing the WebOC colors

Change the following css variable to change the colors used in light or dark mode:

| Variable | Description |
| --- | ---- |
| `--weboc-app-bar-bg-color` | Color of app top menu bar |
| `--theme-color` | Color of texts and chart axes |
| `--contrast-color` | Contrast color used in charts |
| `--canvas-fill` | Chart canvas background color |

### Changing the WebOC fonts

It is easy to host your own set of [web fonts](https://developer.mozilla.org/en-US/docs/Learn/CSS/Styling_text/Web_fonts) or use a service like Google fonts https://fonts.google.com/.

To use a font from the Google font service — check license conditions — replace the first import (`@import './fonts/exo-2/fonts.css';`) with the import statement for including the selected font. Take the import statement from the "Web @import" tab at https://fonts.google.com/selection/embed after selecting a font. 

As an example, the following import make the Dancing Script fonts available

```css
@import url('https://fonts.googleapis.com/css2?family=Dancing+Script:wght@400..700&display=swap')
```

Then change the `--font-family` variable to read
```css
:root {
  --font-family: 'Dancing Script', sans-serif;
  ...
}
```
The correct name of the font can also be found at https://fonts.google.com/selection/embed. 



> [!TIP]
> Using a font service might require changes to the `font-src` and `style-src` Content Security Policy in the webserver configuration.

Self hosting of web fonts requires fonts in a `woff` or `woff2` format.
