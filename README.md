# fews-web-oc

## Project setup

```
npm install
```

### Compiles and hot-reloads for development

```
npm run serve
```

### Compiles and minifies for production

```
npm run build
```

### Run your unit tests

```
npm run test:unit
```

### Lints and fixes files

```
npm run lint
```

### Customize configuration

See [Configuration Reference](https://cli.vuejs.org/config/).

## Application Configuration

The application configuration is stored in the `.env` or the `public/app-config.json` file. All settings are provided as a key-value pair.
Settings in the `.env` file are parsed on build time, while settings in the `app-config.json` are handled on run-time.
The following settings can be provided:

| Key                                    | Description                                                                                                           |
| -------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `VUE_APP_FEWS_WEBSERVICES_URL`         | Url of the FewsWebServices, e.g. "https://rwsos-dataservices-ont.avi.deltares.nl/iwp/FewsWebServices"                 |
| `VUE_APP_REQUEST_HEADER_AUTHORIZATION` | 'Bearer': pass OIDC `id_token` as bearer for request to the FewsWebServices                                           |
|                                        | 'Off': no Authorization request header                                                                                |
| `VUE_APP_AUTH_AUTHORITY`               | Url of the OIDC authority, e.g. "https://login.microsoftonline.com/MYTENANTID/".                                      |
|                                        | If not configured the web oc can be accessed without authentication.                                                  |
| `VUE_APP_AUTH_METADATA_URL`            | Url of the OIDC meta data, e.g. "https://login.microsoftonline.com/MYTENANTID/v2.0/.well-known/openid-configuration". |
| `VUE_APP_AUTH_SCOPE`                   | Scope, e.g. "openid profile email Offline_Access api://myclientid/Delft-FEWSWebServices".                             |
| `VUE_APP_REQUEST_HEADER_AUTHORIZATION` | Url of the OIDC meta data, e.g. "https://login.microsoftonline.com/MYTENANTID/v2.0/.well-known/openid-configuration". |
| `VUE_APP_MAPBOX_TOKEN`                 | Mapbox token. Can be retrieved from: https://account.mapbox.com/access-tokens.                                        |

For general documentation about the Web OC, please see:

[Documentation](docs/)

## Installing the fews-web-oc-components package

There are multiple ways to be able to install the package.

**Through ~/.npmrc**

Open the `~/.npmrc` file and write the following line:

```text
//npm.pkg.github.com/:_authToken=TOKEN
```

`TOKEN` should be replaced with a [personal access token](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token) with the following scope:

- read:packages

**WARNING**
DO NOT PUSH YOUR PERSONAL ACCESS TOKEN TO GITHUB

**Through command line**

Open a terminal in the project root and type:

```commandline
$ npm login --scope=@deltares --registry=https://npm.pkg.github.com

> Username: GITHUB USERNAME
> Password: PERSONAL ACCESS TOKEN WITH read:packages SCOPE
> Email: PUBLIC-EMAIL-ADDRESS

$ npm install

```
