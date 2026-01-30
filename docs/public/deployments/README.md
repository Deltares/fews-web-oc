# Delft-FEWS Web OC Deployments

The Delft-FEWS Web OC is distributed as a single page web application.
When deployed to a server like Nginx or Tomcat it is required to make sure that all requests are mapped to the index.html page of the web oc.
This means that the server will have to redirect all HTTP 404 errors to the index.html. How this can be done is explained per deployment option.

## Tomcat

The Delft-FEWS Web OC can be deployed in Tomcat. The Web OC can be provided as different distributions: root or weboc.

The following assumes a root distribution, but where "ROOT" is used in the following it can also be replaced with "weboc" when a weboc distribution is used.

In the webapps folder of tomcat, create a directory named: "ROOT".
Unzip the Delft-FEWS Web OC distribution into that folder.
Create a subfolder "WEB-INF" in the ROOT folder.
Create the file "[web.xml](tomcat/ROOT/WEB-INF/web.xml)" in the WEB-INF folder.

```xml
<?xml version="1.0" encoding="UTF-8"?>
<web-app xmlns="http://java.sun.com/xml/ns/javaee"
xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
xsi:schemaLocation="http://java.sun.com/xml/ns/javaee
http://java.sun.com/xml/ns/javaee/web-app_3_0.xsd"
version="3.0">
<description>Delft-FEWS Web OC</description>
<!-- For the web oc all 404 errors need to redirect to the index.html page. -->
<error-page>
<error-code>404</error-code>
<location>/index.html</location>
</error-page>
</web-app>
```

Customize the app-config.json file.

After starting tomcat, the Delft-FEWS Web OC is available at: http://localhost:8080

## Azure Static Web App using Azure DevOps

Using Azure DevOps a pipeline can be created to build and deploy the Delft-FEWS Web OC.
The following is an example of a pipeline: [azure-pipelines.yml](azure/azure-pipelines.yml).
To make sure all requests are redirected to the index.html, the following [staticwebapp.config.json](azure/staticwebapp.config.json) has to be added to the deployment.

## Delft-FEWS Standalone

The Delft-FEWS Web OC can be deployed in a Delft-FEWS Standalone as follows.

In the "Modules" folder of the Delft-FEWS Region Home folder, create a directory named: "weboc".
Unzip the Delft-FEWS Web OC distribution into that folder.
Create a subfolder "WEB-INF" in the weboc folder (step not required when a full Web OC distribution has been provided by Deltares).

Create the file "[web.xml](delftfews-sa/Modules/weboc/WEB-INF/web.xml)" in the WEB-INF folder (step not required when a full Web OC distribution has been provided by Deltares).

```xml
<?xml version="1.0" encoding="UTF-8"?>
<web-app xmlns="http://java.sun.com/xml/ns/javaee"
xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
xsi:schemaLocation="http://java.sun.com/xml/ns/javaee
http://java.sun.com/xml/ns/javaee/web-app_3_0.xsd"
version="3.0">
<description>Delft-FEWS Web OC</description>
<!-- For the web oc all 404 errors need to redirect to the index.html page. -->
<error-page>
<error-code>404</error-code>
<location>/index.html</location>
</error-page>
</web-app>
```

Customize the app-config.json file where appropriate.

After starting tomcat using F12+M (embedded servers, start embedded tomcat web services) in the Standalone the Delft-FEWS Web OC is available at: http://localhost:8080. Log message in Delft-FEWS SA: 
`INFO - StartFewsWebServices.FewsWebServicesEmbeddedTomcatServer.run - The Web OC will be available at: http://localhost:8080`.

In order to display Web OC, navigate to http://localhost:8080 in a browser (copy-paste http://localhost:8080 in browser window). Please use an incognito browser window to avoid looking at cached content.  

## Nginx

In Nginx the recommended way is to use try_files. See: https://router.vuejs.org/guide/essentials/history-mode.html#nginx

An example Nginx configuration looks as follows:

```xml
server {
    listen 80 default_server;
    listen [::]:80 default_server;

    root /usr/share/nginx/html;
    index index.html index.htm;

    server_name _;
    location / {
        try_files $uri $uri/ /index.html;
    }
}

```

unzip the weboc.zip file into the Nginx html folder:

/usr/share/nginx/html/

the WebOC will be available in the root at port 80: http://mynginxserver/

## Apache HTTPD

The Delft-FEWS Web OC can be deployed in Apache HTTPD as follows:

```xml

<VirtualHost *:80>
        ServerName localhost
        DocumentRoot "/var/www/weboc"

<Directory /var/www/weboc/>
        RewriteEngine on
        RewriteCond %{REQUEST_FILENAME} !-d
        RewriteCond %{REQUEST_FILENAME} !-f
        RewriteRule ^ index.html [L]
        </Directory>
        </VirtualHost>

```

## Access to FewsWebServices

Please note that every user of Web OC requires direct access to the FewsWebServices endpoints by default. If needed, FewsWebServices requests can be re-directed. Please find an apache example below.

```
# Redirect FewsWebServices requests to local server.
<Location /weboc/fewswebservices>
    ProxyPass http://fewswebservices_host_name:port
    ProxyPassReverse http://fewswebservices_host_name:port
</Location>

```

## Content Security Policy (CSP) Headers

These headers are used to define the security policies for a web page, 
specifying which resources can be loaded and executed by the browser.
It is advised to add CSP headers in the server configuration.

The WebOC requires the following policies:

| Header | Value |
| ------ | ----- |
| default-src | 'none'|
| script-src | 'self'|
| manifest-src | 'self' `FEWS_WEBSERVICES_DOMAIN`|
| font-src | 'self'| |
| style-src | 'self' 'unsafe-inline'|
| worker-src | blob:|
| img-src | 'self' data: blob: `FEWS_WEBSERVICES_DOMAIN` |
| connect-src | 'self' https://basemaps.cartocdn.com https://*.basemaps.cartocdn.com `FEWS_WEBSERVICES_DOMAIN` `AUTHORITY_DOMAIN`|

Replace `FEWS_WEBSERVICES_DOMAIN` with the domain of the FEWS web services are available. Leave empty when this is the same domain as where the Web OC is hosted. 
Replace `AUTHORITY_DOMAIN` with the domain of the configured OIDC authority provider (e.g. https://login.microsoftonline.com for Microsoft identity platform). Leave empty when no authority provider is used.
When a custom `VITE_APP_MANIFEST_URL` is configured make sure the `manifest-src` configuration includes the `FEWS_WEBSERVICES_DOMAIN` value, otherwise it can be left out.

For more information, refer to the MDN documentation:
[Content Security Policy (CSP) - MDN Web Docs](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
 
