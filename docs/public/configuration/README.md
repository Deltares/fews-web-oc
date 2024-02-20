# Web OC Delft-FEWS configuration

## Introduction

In order to connect Web OC to a FewsWebServices instance, some basic configuration is required in app-config.json. Please refer to: https://github.com/Deltares/fews-web-oc/blob/main/README.md.
All configuration related to what content is being displayed in Web OC, is managed by the Delft-FEWS configuration. For general documentation on this matter please refer to: https://publicwiki.deltares.nl/display/FEWSDOC/Configuring+Delft-FEWS+-+Configuration+Guide

Key files in the FEWS Configuration to get started with Web OC are:

- `WebOperatorClient.xml` (SystemConfigFiles). Configure available Web OC components as well as general items like title and logo: https://publicwiki.deltares.nl/display/FEWSDOC/11+Web+Operator+Client
- `WebServices.xml` (PiServiceConfigFiles). Web OC highly depends on what data is made available through FewsWebServices, Use this configuration file to configure a filterId, permissions etc.: https://publicwiki.deltares.nl/pages/viewpage.action?pageId=220266993

Although Web OC will run without any further adjustments to the Delft-FEWS configuration, its strongly recommended to spend some time on your Topology configuration in relation to Web OC (see below).

> **_NOTE:_** Please note that Web OC will always use the system time of the Web OC users device as Web OC system time. This time setting can not be modified by Web OC configuration.

## General Web OC configuration

```xml
<?xml version="1.0" encoding="UTF-8"?>
<webOperatorClient xmlns="http://www.wldelft.nl/fews"
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
    xsi:schemaLocation="http://www.wldelft.nl/fews https://fewsdocs.deltares.nl/schemas/version1.0/webOperatorClient.xsd">
    <general>
        <title>Delft FEWS Web Operator Client</title>
        <icons>
            <logo>deltares_logo.png</logo>
            <favicon>deltares_favicon.svg</favicon>
        </icons>
        <defaultComponent>topologyDisplay</defaultComponent>
        <customStyleSheet>weboc-default-style.css</customStyleSheet>
        <splashScreen>image.png</splashScreen>
        <helpMenu>
            <url name="Help entry links to external url">https://example.com</url>
            <path name="Help entry links to path in Web OC">terms-of-use</path>
        </helpMenu>
    </general>
    <components>
        <topologyDisplay>
            <title>Topology Disiplay</title>
            <defaultPath>
                <nodeId>topololgy_node_id</nodeId>
            </defaultPath>
            <showLeafNodesAsButtons>true</showLeafNodesAsButtons>
        </topologyDisplay>
        <htmlDisplay>
            <title>Terms of Use page</title>
            <path>terms-of-use</path>
            <viewPermission>public</viewPermission>
            <url>terms-of-use.html</url>
        </htmlDisplay>
    </components>
</webOperatorClient>
```

^ **NOTE**: The FEWS PI webservices (2023.02) can be used to serve [static web resources](https://fewsdocs.deltares.nl/webservices/rest-api/v1/#get-/resources/static/-path-/-id-).
Relative urls in `WebOperatorClient.xml` are first resolved against the base url of the Web OC instance (e.g. `deltares_logo.png`), and then against the resources endpoint of the FewsWebServices instance.

### Styling

With the customStyleSheet option in the `WebOperatorClient.xml` , it is possible to load a custom stylesheet for Web OC. This stylesheet will be loaded after the default stylesheet and can be used to override default styles. The custom stylesheet should be placed in the same directory as the index.html file.

```css
@import '../fonts/exo-2/fonts.css';
@import './default-styles.css';
@import './vuetifiy-overrule.css';

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

**Fonts**

**Icons**


## Web OC navigation using Topology

- While the Web OC does not aim to become a copy of the "thick" client, it is explicitly built based on the underlying FEWS configuration. Think of items such as display groups, SSD, filters, grid plots, etc.
- The current FEWS Client has a multitude of tree/folder structures (Filters, Spatial Display, Topology, Display Groups, Manual Forecast) that we prefer not to duplicate in Web OC. Ideally, we want to use a single menu/folder structure from which various data displays can be accessed, and actions can be taken.
- The architecture of the Web OC lends itself to the development of different functional components and displays for specific use. Nonetheless, we want to offer basic components that provide an excellent starting point for many users.

When we want to limit ourselves to a single menu/folder structure configured in FEWS for navigation in Web OC, it is logical to base this on Topology.xml. In Web OC, the entire Topology structure is displayed, to which the Web OC user has access via FewsWebServices.

For the general configuration of Topology.xml, please refer to https://publicwiki.deltares.nl/display/FEWSDOC/24+Topology.

Topology nodes in the Web OC component TopologyDisplay can be linked using Topology.xml as described below.

| **Link topology node to** | **Config item** | **Back-end support** | **Web OC Support** |
| ------------------------- | --------------- | -------------------- | ------------------ |
| Spatial Display           | PlotId          | Yes                  | Yes                |
| Filters                   | FilterId        | Yes                  | Yes                |
| Web Browser               | url             | Yes                  | Yes                |
| DisplayGroup              | DisplayGroupId  | Yes                  | Yes                |
| Run Task                  | WorkFlowId      | Yes                  | Not yet            |
| SchematicStatusDisplay    | PanelId         | 2024.01              | Not yet            |
| System Monitor            | TabId           | 2024.01              | Not yet            |

**Spatial Display**

Web OC will show a map, displaying the configured plotId linked to the selected topology node. Use the `<gridDisplaySelection>` item in Toplogy.xml to configure a plotId. A time slider will show up for navigation in time. The period covered by the time slider is based on the configured relative view period of the time series in the GridDisplay.xml with reference to the system time of Web OC (system time of users device).

**Filters**

Web OC will show a map, displaying all locations configured in the filterId linked to the selected topology node. Locations are also listed in a drop down menu. Use the `<filterId>` item in Toplogy.xml to configure a filterId. By selecting a location on the map or from the list, time series graphs will be displayed for all parameters configured in Filters.xml for the linked filterId. Time series graphs are grouped by parameterGroup. The period shown in the graph corresponds to the configured relative view period (relative to Web OC system time) of the time series in the Filters.xml

**Web Browser**

When a `<url>` element is configured in the selected topology node, Web OC will open a new browser window for the url configured.

**DisplayGroup**

Web OC will show a time series graph and a drop down menu for selection of displays within the configured displayGroup. Currently, two configuration options are supported by Web OC to link DisplayGroups to Topology nodes:

1. Configure a `<nodeId>` element for a DisplayGroup in DisplayGroups.xml. No additional configuration required in Topology.xml.
2. Configure a `<displayGroupId>` element for a Topology node in Topology.xml

The period shown in the graph corresponds to the configured relative view period in DisplayGroups.xml

### Permissions

By assigning viewPermissions in Topology.xml, it is possible to configure nodes for Web OC users that do not affect usage in the "thick" client. If authentication is not used for Web OC, permissions can still be utilized by configuring "defaultUser" in WebServices.xml (https://publicwiki.deltares.nl/pages/viewpage.action?pageId=220266993). The Web OC component that utilizes Topology.xml is TopologyDisplay.

## Other WEB OC functional components

Next to the Topology Display, three additional components can be configured in WebOperatorClient.xml: spatialDisplay, systemMonitor and schematicStatusDisplay.

**spatialDisplay**: A tree view will list all gridPlots (configured permissions respected) from the Spatial Display. Selected dataLayer will be displayed on the map.

**systemMonitor**: “Import status” and “Running Tasks” components of system monitor will be displayed in Web OC.

**schematicStatusDisplay**: A tree view will list all SSD displayGroups including all displayPanels (configured permissions respected) available to FewsWebServices. Most click-actions on displayPanels are supported: https://publicwiki.deltares.nl/display/FEWSDOC/FEWS+Schematic+Status+Display+%28SSD%29+Web+Service

## Known issues

- The FewsWebServices _thinning_ option is used (https://publicwiki.deltares.nl/display/FEWSDOC/FEWS+PI+REST+Web+Service#FEWSPIRESTWebService-GETtimeseries) while retreiving data for Web OC timeseries graphs and tables. This function tries to keep the peaks and gaps and minimizes the number of time steps that have to be retrieved. Eventually, _thinning_ should not be used for timeseries tables. In future releases of Web OC _thinning_ will only be used for timeseries graphs.
