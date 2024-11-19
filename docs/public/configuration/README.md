# Web OC Delft-FEWS configuration

## Introduction

In order to connect Web OC to a FewsWebServices instance, some basic configuration is required in app-config.json. Please refer to: [Web OC application configuration](https://deltares.github.io/fews-web-oc/app_configuration/).
All configuration related to what content is being displayed in Web OC, is managed by the Delft-FEWS configuration. For general documentation on this matter please refer to: [Delft-FEWS Configuration Guide](https://publicwiki.deltares.nl/display/FEWSDOC/Configuring+Delft-FEWS+-+Configuration+Guide)

Key files in the Delft-FEWS Configuration to get started with Web OC are:

- WebOperatorClient.xml (SystemConfigFiles). [Configure](https://publicwiki.deltares.nl/display/FEWSDOC/11+Web+Operator+Client) available Web OC components as well as general items like title and logo.
- WebServices.xml (PiServiceConfigFiles). Web OC highly depends on what data is made available through FewsWebServices, Use [this](https://publicwiki.deltares.nl/pages/viewpage.action?pageId=220266993) configuration file to configure a filterId, permissions etc.

Although Web OC will run without any further adjustments to the Delft-FEWS configuration, we strongly recommend you spend some time on your Topology configuration in relation to Web OC (see below).

### System time

Please note that Web OC will always use the system time of the Web OC user's device as Web OC system time. This time setting can not be modified by Web OC configuration.

## Web OC navigation using Topology

- While the Web OC does not aim to become a copy of the "thick" client, it is explicitly built based on the underlying Delft-FEWS configuration. Think of items such as display groups, schematic status display, filters, grid plots, etc.
- The current Delft-FEWS Client has a multitude of tree/folder structures (Filters, Spatial Display, Topology, Display Groups, Manual Forecast) that we prefer not to duplicate in Web OC. Ideally, we want to use a single menu/folder structure from which various data displays can be accessed, and actions can be taken.
- The architecture of the Web OC lends itself to the development of different functional components and displays for specific use. Nonetheless, we want to offer basic components that provide an excellent starting point for many users.

When we want to limit ourselves to a single menu/folder structure configured in Delft-FEWS for navigation in Web OC, it is logical to base this on Topology.xml. In Web OC, the entire Topology structure is displayed, to which the Web OC user has access via FewsWebServices.

For the general configuration of Topology.xml, please refer to: [Topology Configuration](https://publicwiki.deltares.nl/display/FEWSDOC/24+Topology).

Topology nodes in the Web OC component TopologyDisplay can be linked using Topology.xml as described below.

| **Link topology node to** | **Config item**                  | **Back-end support** | **Web OC Support** | **Topology.xml config element**                                     | 
| ------------------------- | ---------------                  | -------------------- | ------------------ | ------------------------------------------------------------------- |
| Spatial Display           | PlotId                           | Yes                  | Yes                | `<gridDisplaySelection>`                                            |
| Filters                   | FilterId                         | Yes                  | Yes                | `<filterId>`                                                        | 
| External url              | url                              | Yes                  | Yes                | `<url>`                                                             | 
| Embedded Browser          | embedUrl                         | Yes                  | Yes                | `<embedUrl>`                                                        | 
| DisplayGroup              | DisplayGroupId, plotId, nodeId   | Yes                  | Yes                | `<nodeId>` (DisplayGroups.xml) or `<displayGroupId>` (Topology.xml) | 
| Run Task                  | secondaryWorkflowId              | Yes                  | Yes                | `<secondaryWorkflowId>`                                             | 
| Data download             | dataDownloadDisplayId            | Yes                  | Yes                | `<dataDownloadDisplayId>`                                           | 
| Report                    | reportModuleInstanceId           | Yes                  | Yes                | `<reportModuleInstanceId>`                                          | 
| Document                  | documentFile                     | Yes                  | Yes                | `<documentFile>`                                                    | 
| SchematicStatusDisplay    | PanelId                          | Yes                  | Yes                | `<scadaDisplayId>` and `<scadaPanelId>`                             | 
| System Monitor            | TabId                            | Not yet              | Not yet            | -                                                                   | 

**Spatial Display**

Web OC will show a map, displaying the configured plotId linked to the selected topology node. Use the `<gridDisplaySelection>` item in Toplogy.xml to configure a plotId. A time slider will show up for navigation in time. The period covered by the time slider is based on the configured relative view period of the time series in the GridDisplay.xml with reference to the system time of Web OC (system time of users device).
The classbreaks (legend) on the Spatial Display is only shown in the Web-OC when the Spatial Display plotId uses classbreaks from the TimeSeriesDisplayConfig.xml. Examples are provided on the Delft-FEWS WIKI pages: [Time Series Display Configuration](https://publicwiki.deltares.nl/display/FEWSDOC/02+Time+Series+Display+Configuration) and [Grid Display Configuration](https://publicwiki.deltares.nl/display/FEWSDOC/01+Grid+Display#id-01GridDisplay-_Toc154574473_Toc95297306classBreaks). It is possible to configure multiple classBreaks for a single gridPlot. Web OC will allow users to switch between them. 

Optionally, gridded vector data can be shown as an animated layer in Web OC by configuring the `<animatedVectors>` settings in [Spatial Display](https://publicwiki.deltares.nl/display/FEWSDOC/01+Grid+Display).

**Filters**

Web OC will show a map, displaying all locations configured in the filterId linked to the selected topology node. Locations are also listed in a drop-down menu. Use the `<filterId>` item in Topology.xml to configure a filterId. By selecting a location on the map or from the list, time series graphs will be displayed for all parameters configured in Filters.xml for the linked filterId. Time series graphs are grouped by parameterGroup. The period shown in the graph corresponds to the configured relative view period (relative to Web OC system time) of the time series in the Filters.xml.

When locations are shown on the Web OC map, icons are used as configured in Delft-FEWS. Also, icon overlays for threshold crossings are shown consistently with the Delft-FEWS Desktop OC. Check threshold configuration [documentation](https://publicwiki.deltares.nl/display/FEWSDOC/09+Thresholds). When `<showActiveThresholdCrossingsForFilters>true</showActiveThresholdCrossingsForFilters>` is configured in WebOperatorClient.xml, an indicator for the number of locations with threshold crossings per topology node will be shown in Web OC.

**External url**

When a `<url>` element is configured in the selected topology node, Web OC will open a new browser window (outside Web OC) for the url configured. NB This is only supported for toplogy nodes with _only_ the `<url>` element configured. 

**Embedded Browser**

When a `<embedUrl>` element is configured in the selected topology node, Web OC will open a embedded browser window for the url configured. Please note that [Content Security Policy](https://deltares.github.io/fews-web-oc/deployments/#content-security-policy-csp-headers) have to be configured correctly to allow embedding.

**DisplayGroup**

Web OC will show a time series graph and a drop-down menu for selection of displays within the configured displayGroup. Currently, two configuration options are supported by Web OC to link DisplayGroups to Topology nodes:

1. Configure a `<nodeId>` element for a DisplayGroup in DisplayGroups.xml. No additional configuration is required in Topology.xml.
2. Configure a `<displayGroupId>` element for a Topology node in Topology.xml

The period shown in the graph corresponds to the configured relative view period in DisplayGroups.xml

**Run Task**

It is possible to submit a task to the Delft-FEWS back-end by configuring a `<secondaryWorkflowId>` in Topology.xml. You have to explicitly allow tasks to run from Web OC by configuring `<enableTaskRuns>true</enableTaskRuns>` in WebOperatorClient.xml (default is false). When correctly configured, a run button will appear in Web OC above the topology tree. When selected, a pop-up menu will allow the user to choose from the secondary workflows configured (multiple workflows can be linked to a single node). A task description can be added before submitting the task.

_Workflow properties_

Workflow properties can be configured in [WorkflowDescriptors.xml](https://publicwiki.deltares.nl/display/FEWSDOC/13+WorkflowDescriptors). If properties are configured to be editable with `<editableProperty>`, a form will be shown in Web OC where these properties can be modified from their default value by the user. 

Pre-defined properties are xMin, xMax, yMin, yMax, xCellSize, and yCellSize. When these properties are configured, Web OC will provide users with the option to draw a bounding box on the map. The task will be submitted using the [processdata endpoint](https://publicwiki.deltares.nl/display/FEWSDOC/FEWS+PI+REST+Web+Service#FEWSPIRESTWebService-GETprocessdata(2017.02)) instead of [POST run task](https://publicwiki.deltares.nl/display/FEWSDOC/FEWS+PI+REST+Web+Service#FEWSPIRESTWebService-POSTruntask(2017.02)). The purpose of the processdata endpoint is to download data based on the xMin, xMax, yMin, yMax, xCellSize, and yCellSize properties provided by the user. A pre-defined property "FILE_NAME" can be configured in [WorkflowDescriptors.xml](https://publicwiki.deltares.nl/display/FEWSDOC/13+WorkflowDescriptors) to set the name of the file to be downloaded. The file name will then be "yyyyMMdd_HHmm_FILE_NAME".

Limitations:
- T0 will be set to time of submission (respecting cardinal time step)
- Only secondary workflows are supported
- Features such as state selection, what-if scenarios, etc. are not supported

**Reports**

Reports generated by the [FEWS Report Module](https://publicwiki.deltares.nl/display/FEWSDOC/09+Report+Module) can be made available for display in Web OC. In order to link a report to a topology node, the element `<reportModuleInstanceId>` in Topology.xml has be configured at topology node level. Only reports that are stored in the FEWS database can be displayed in Web OC (`<sendToLocalFileSystem> = false`) in report module configuration)

**Document**

A static document (typically HTML format) can be linked to a topology node. In order to link a document to a topology node, the element `<documentFile>` in Topology.xml has be configured at topology node level. The document itself should be part of the FEWS configuration (Config/WebResourcesFiles).

**Topology active threshold crossings**

Both Desktop OC and Web OC can show location threshold icons in the topology tree: [documentation](https://publicwiki.deltares.nl/display/FEWSDOC/24+Topology#id-24Topology-Thresholdicons).


### Permissions

By assigning viewPermissions in Topology.xml, it is possible to configure nodes for Web OC users that do not affect usage in the "thick" client. If authentication is not used for Web OC, permissions can still be utilized by configuring "defaultUser" in [WebServices.xml](https://publicwiki.deltares.nl/pages/viewpage.action?pageId=220266993). The Web OC component that utilizes Topology.xml is TopologyDisplay.

## Other WEB OC functional components

Next to the Topology Display, three additional components can be configured in WebOperatorClient.xml: spatialDisplay, systemMonitor and schematicStatusDisplay.

**spatialDisplay**: A tree view will list all gridPlots (configured permissions respected) from the Spatial Display. Selected dataLayer will be displayed on the map.

**systemMonitor**: “Import status” and “Running Tasks” components of system monitor will be displayed in Web OC.

**schematicStatusDisplay**: A tree view will list all SSD displayGroups including all displayPanels (configured permissions respected) available to FewsWebServices. Most click-actions on displayPanels are supported, see [SSD Service documentation](https://publicwiki.deltares.nl/display/FEWSDOC/FEWS+Schematic+Status+Display+%28SSD%29+Web+Service).

**HTML display**: Component, only available in Web OC, to either show static HTML pages stored in the FEWS Configuration (WebResourceFiles) or external web pages. See [WebOperatorClient.xml configuration](https://publicwiki.deltares.nl/display/FEWSDOC/11+Web+Operator+Client).

**Help menu**: Drop-down menu available on the bottow left side of Web OC. See [WebOperatorClient.xml configuration](https://publicwiki.deltares.nl/display/FEWSDOC/11+Web+Operator+Client).

## Known issues

- The FewsWebServices _thinning_ [option](https://publicwiki.deltares.nl/display/FEWSDOC/FEWS+PI+REST+Web+Service#FEWSPIRESTWebService-GETtimeseries) is used while retrieving data for Web OC time series graphs and tables. This function tries to keep the peaks and gaps and minimizes the number of time steps that have to be retrieved. Eventually, _thinning_ should not be used for time series tables. In future releases of Web OC _thinning_ will only be used for time series graphs.
