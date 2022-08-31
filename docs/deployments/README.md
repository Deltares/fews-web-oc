# Delft-FEWS Web OC Deployments

The Delft-FEWS Web OC is distributed as a single page web application.
When deployed to a server like Nginx or Tomcat it is required to make sure that all requests are mapped to the index.html page of the web oc.
This means that the server will have to redirect all HTTP 404 errors to the index.html. How this is described will be explained in per deployment.

## Tomcat

The Delft-FEWS Web OC can be deployed in Tomcat as follows:

In the webapps folder of tomcat, create a directory named: "ROOT".
Unzip the Delft-FEWS Web OC distribution into that folder.
Create a subfolder "WEB-INF" in the ROOT folder.
Create the file "[web.xml](tomcat/ROOT/WEB-INF/web.xml)" in the WEB-INF folder. 

``` xml
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

After starting tomcat the Delft-FEWS Web OC is available at: http://localhost:8080

## Azure Static Web App using Azure DevOps

Using Azure DevOps a pipeline can be created to build and deploy the Delft-FEWS Web OC.
The following is an example of a pipeline: [azure-pipelines.yml](azure/azure-pipelines.yml).
To make sure all requests are redirected to the index.html, the following [staticwebapp.config.json](azure/staticwebapp.config.json) has to be added to the deployment.


## Delft-FEWS Standalone

The Delft-FEWS Web OC can be deployed in a standalone as follows"

In Modules folder of the Delft-FEWS Region Home folder, create a directory named: "weboc".
Unzip the Delft-FEWS Web OC distribution into that folder.
Create a subfolder "WEB-INF" in the weboc folder.

Create the file "[web.xml](delftfews-sa/Modules/weboc/WEB-INF/web.xml)" in the WEB-INF folder.

``` xml
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

After starting tomcat the Delft-FEWS Web OC is available at: http://localhost:8080



## Nginx
TODO
