# Web OC Delft-FEWS configuration

## Introduction

In order to connect Web OC to a FewsWebServices instance, some basic configuration is required in app-config.json. Please refer to: [Web OC application configuration](https://deltares.github.io/fews-web-oc/app_configuration/).
All configuration related to what content is being displayed in Web OC, is managed by the Delft-FEWS configuration. For general documentation on this matter please refer to: [Delft-FEWS Configuration Guide](https://publicwiki.deltares.nl/display/FEWSDOC/Configuring+Delft-FEWS+-+Configuration+Guide)

Key files in the FEWS Configuration to get started with Web OC are:

- WebOperatorClient.xml (SystemConfigFiles). [Configure](https://publicwiki.deltares.nl/display/FEWSDOC/11+Web+Operator+Client) available Web OC components as well as general items like title and logo.
- WebServices.xml (PiServiceConfigFiles). Web OC highly depends on what data is made available through FewsWebServices, Use [this](https://publicwiki.deltares.nl/pages/viewpage.action?pageId=220266993) configuration file to configure a filterId, permissions etc.

Although Web OC will run without any further adjustments to the Delft-FEWS configuration, its strongly recommended to spend some time on your Topology configuration in relation to Web OC (see below).

### System time

Please note that Web OC will always use the system time of the Web OC users device as Web OC system time. This time setting can not be modified by Web OC configuration.

## Web OC navigation using Topology

- While the Web OC does not aim to become a copy of the "thick" client, it is explicitly built based on the underlying FEWS configuration. Think of items such as display groups, SSD, filters, grid plots, etc.
- The current FEWS Client has a multitude of tree/folder structures (Filters, Spatial Display, Topology, Display Groups, Manual Forecast) that we prefer not to duplicate in Web OC. Ideally, we want to use a single menu/folder structure from which various data displays can be accessed, and actions can be taken.
- The architecture of the Web OC lends itself to the development of different functional components and displays for specific use. Nonetheless, we want to offer basic components that provide an excellent starting point for many users.

When we want to limit ourselves to a single menu/folder structure configured in FEWS for navigation in Web OC, it is logical to base this on Topology.xml. In Web OC, the entire Topology structure is displayed, to which the Web OC user has access via FewsWebServices.

For the general configuration of Topology.xml, please refer to: [Topology Configuration](https://publicwiki.deltares.nl/display/FEWSDOC/24+Topology).

Topology nodes in the Web OC component TopologyDisplay can be linked using Topology.xml as described below.

| **Link topology node to** | **Config item**                  | **Back-end support** | **Web OC Support** |
| ------------------------- | ---------------                  | -------------------- | ------------------ |
| Spatial Display           | PlotId                           | Yes                  | Yes                |
| Filters                   | FilterId                         | Yes                  | Yes                |
| Web Browser               | url                              | Yes                  | Yes                |
| DisplayGroup              | DisplayGroupId, plotId, nodeId   | Yes                  | Yes                |
| Run Task                  | (secondary) WorkFlowId           | Yes                  | Planned for 2024   |
| Data download             | dataDownloadDisplayId            | 2024.01              | Planned for 2024   |
| SchematicStatusDisplay    | PanelId                          | Not yet              | Not yet            |
| System Monitor            | TabId                            | Not yet              | Not yet            |

**Spatial Display**

Web OC will show a map, displaying the configured plotId linked to the selected topology node. Use the `<gridDisplaySelection>` item in Toplogy.xml to configure a plotId. A time slider will show up for navigation in time. The period covered by the time slider is based on the configured relative view period of the time series in the GridDisplay.xml with reference to the system time of Web OC (system time of users device).
The classbreaks (legend) on the Spatial Display is only shown in the Web-OC when the Spatial Display plotId uses classbreaks from the TimeSeriesDisplayConfig.xml. Examples are provided on the Delft-FEWS WIKI pages: [Time series display configuration](https://publicwiki.deltares.nl/display/FEWSDOC/02+Time+Series+Display+Configuration) and [Grid display configuration](https://publicwiki.deltares.nl/display/FEWSDOC/01+Grid+Display#id-01GridDisplay-_Toc154574473_Toc95297306classBreaks). 

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

By assigning viewPermissions in Topology.xml, it is possible to configure nodes for Web OC users that do not affect usage in the "thick" client. If authentication is not used for Web OC, permissions can still be utilized by configuring "defaultUser" in [WebServices.xml](https://publicwiki.deltares.nl/pages/viewpage.action?pageId=220266993). The Web OC component that utilizes Topology.xml is TopologyDisplay.

## Other WEB OC functional components

Next to the Topology Display, three additional components can be configured in WebOperatorClient.xml: spatialDisplay, systemMonitor and schematicStatusDisplay.

**spatialDisplay**: A tree view will list all gridPlots (configured permissions respected) from the Spatial Display. Selected dataLayer will be displayed on the map.

**systemMonitor**: “Import status” and “Running Tasks” components of system monitor will be displayed in Web OC.

**schematicStatusDisplay**: A tree view will list all SSD displayGroups including all displayPanels (configured permissions respected) available to FewsWebServices. Most click-actions on displayPanels are supported, see [SSD Service documentation](https://publicwiki.deltares.nl/display/FEWSDOC/FEWS+Schematic+Status+Display+%28SSD%29+Web+Service).

## Known issues

- The FewsWebServices _thinning_ [option](https://publicwiki.deltares.nl/display/FEWSDOC/FEWS+PI+REST+Web+Service#FEWSPIRESTWebService-GETtimeseries) is used while retreiving data for Web OC timeseries graphs and tables. This function tries to keep the peaks and gaps and minimizes the number of time steps that have to be retrieved. Eventually, _thinning_ should not be used for timeseries tables. In future releases of Web OC _thinning_ will only be used for timeseries graphs.
