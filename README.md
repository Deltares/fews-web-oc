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

| Key                                    | Description                                                                                           |
| -------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `VUE_APP_FEWS_WEBSERVICES_URL`         | Url of the FewsWebServices, e.g. "https://rwsos-dataservices-ont.avi.deltares.nl/iwp/FewsWebServices" |
| `VUE_APP_REQEUST_HEADER_AUTHORIZATION` | 'Bearer': pass OIDC `id_token` as bearer for request to the FewsWebServices                           |
|                                        | 'Off': no Authorization request header                                                                |
