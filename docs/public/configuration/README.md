# Web OC Delft-FEWS configuration

## Introduction

In order to connect Web OC to a FewsWebServices instance, some basic configuration is required in app-config.json. Please refer to: [Web OC application configuration](https://deltares.github.io/fews-web-oc/app_configuration/).
All configuration related to what content is being displayed in Web OC, is managed by the Delft-FEWS configuration. For general documentation on this matter please refer to: [Delft-FEWS Configuration Guide](https://publicwiki.deltares.nl/display/FEWSDOC/Configuring+Delft-FEWS+-+Configuration+Guide)

Key files in the Delft-FEWS Configuration to get started with Web OC are:

- WebOperatorClient.xml (SystemConfigFiles). [Configure](https://publicwiki.deltares.nl/display/FEWSDOC/11+Web+Operator+Client) available Web OC components as well as general items like title and logo.
- WebServices.xml (PiServiceConfigFiles). Web OC highly depends on what data is made available through FewsWebServices, Use [this](https://publicwiki.deltares.nl/pages/viewpage.action?pageId=220266993) configuration file to configure a filterId, permissions etc.

Although Web OC will run without any further adjustments to the Delft-FEWS configuration, we strongly recommend you spend some time on your Topology configuration in relation to Web OC (see below).

### System time

Please note that Web OC will always use the system time of the Web OC user's device as Web OC system time. This time setting cannot be modified by Web OC configuration.

## Web OC navigation using Topology

- While the Web OC does not aim to become a copy of the "thick" client, it is explicitly built based on the underlying Delft-FEWS configuration. Think of items such as display groups, schematic status display, filters, grid plots, etc.
- The current Delft-FEWS Client has a multitude of tree/folder structures (Filters, Spatial Display, Topology, Display Groups, Manual Forecast) that we prefer not to duplicate in Web OC. Ideally, we want to use a single menu/folder structure from which various data displays can be accessed, and actions can be taken.
- The architecture of the Web OC lends itself to the development of different functional components and displays for specific use. Nonetheless, we want to offer basic components that provide an excellent starting point for many users.

When we want to limit ourselves to a single menu/folder structure configured in Delft-FEWS for navigation in Web OC, it is logical to base this on Topology.xml. In Web OC, the entire Topology structure is displayed, to which the Web OC user has access via FewsWebServices.

For the general configuration of Topology.xml, please refer to: [Topology Configuration](https://publicwiki.deltares.nl/display/FEWSDOC/24+Topology).

Topology nodes in the Web OC component TopologyDisplay can be linked using Topology.xml as described below.

| **Link topology node to** | **Back-end support** | **Web OC Support** | **Topology.xml config element**                                     | 
|----------------------------|----------------------|--------------------|---------------------------------------------------------------------|
| Data Analysis Display      | Yes                  | Yes                | `<dataAnalysisDisplayId>`                                           | 
| Data download              | Yes                  | Yes                | `<dataDownloadDisplayId>`                                           | 
| DisplayGroup               | Yes                  | Yes                | `<nodeId>` (DisplayGroups.xml) or `<displayGroupId>` (Topology.xml) | 
| Display Information Document   | Yes                  | Yes                | `<documentFile>`                                                    | 
| Document Displays          | Yes                  | Yes                | `<documentDisplayId>`                                               |
| Dynamic report             | Yes                  | Yes                | `<dynamicReportDisplayId>`                                          |
| Embedded Browser           | Yes                  | Yes                | `<embedUrl>`                                                        | 
| External url               | Yes                  | Yes                | `<url>`                                                             | 
| Filters                    | Yes                  | Yes                | `<filterId>`                                                        | 
| Log Displays                | Yes                  | Yes               | `<logDisplayId>`                                                    | 
| Report                     | Yes                  | Yes                | `<reportModuleInstanceId>`                                          | 
| Run Task                   | Yes                  | Yes                | `<workflowId>` and `<secondaryWorkflowId>`                          | 
| SchematicStatusDisplay     | Yes                  | Yes                | `<scadaDisplayId>` and `<scadaPanelId>`                             | 
| Spatial Display            | Yes                  | Yes                | `<gridDisplaySelection>`                                            |
| Web OC Dashboard           | Yes                  | Yes                | `<webOCDashboardId>`                                                |

**Data Analysis Display**

Data Analysis Displays can be configured in the `DataAnalysisDisplays.xml`, part of the DisplayConfigFiles. One or more Data Analysis Displays can be configured and referenced in the `Topology.xml` using the `<dataAnalysisDisplayId>` element. 

Please refer to the configuration documentation on how to configure the Data Analysis Displays [documentation](https://publicwiki.deltares.nl/spaces/FEWSDOC/pages/352944209/35+Data+Analysis+Displays+Web+OC+only).

---

**Data download**

A data download display can be visualised in the WebOC by referencing a configured dataDownLoadDisplay Template through the `<dataDownloadDisplayId>` in combination with a `<filterId>`.

---

**DisplayGroup**

Web OC will show a time series graph and a drop-down menu for selection of displays within the configured displayGroup. Currently, two configuration options are supported by Web OC to link DisplayGroups to Topology nodes:

1. Configure a `<nodeId>` element for a DisplayGroup in `DisplayGroups.xml`. No additional configuration is required in `Topology.xml`.
2. Configure a `<displayGroupId>` element for a Topology node in `Topology.xml`.

The period shown in the graph corresponds to the configured relative view period in `DisplayGroups.xml`.

---

**Display Information Document**

A static document (typically HTML format) can be linked to a topology node. In order to link a document to a topology node, the element `<documentFile>` in `Topology.xml` has to be configured at topology node level. The document itself should be part of the FEWS configuration (`Config/WebResourcesFiles`). The content of the document will be visualised under the **"More Info"** section in the side panel.  

---

**Document Displays**

Document Displays as configured in the `DisplayConfigFiles` folder of the Delft-FEWS Config are available in the WebOC. One or more displays can be configured in the `DocumentDisplays.xml`. There are three different types of document displays: 

1. **Report display**: Visualise and edit reports based on  
   - `reportModuleInstanceId` or  
   - `archiveProductId`
2. **Document Browser**: Browse and visualise products in the Archive.  
3. **Compose display**: Produce on the fly a new `archiveProduct` based on a template.  

For more information about the configuration of the Document Displays refer to the [Document Display configuration documentation](https://publicwiki.deltares.nl/spaces/FEWSDOC/pages/352944205/34+Document+Displays+Web+OC+only).

---

**Dynamic report**

The dynamic report module provides the ability to dynamically generate a report based on a template configured in FEWS. This typically involves time- and/or location-dependent data displayed in tabular format. See: [Dynamic Report Displays](https://publicwiki.deltares.nl/spaces/FEWSDOC/pages/352944402/37+Dynamic+Report+Displays+Web+OC+only).  

The dynamic report can be linked to the topology using `<dynamicReportDisplayId>` in *Topology.xml*. Web OC displays a time slider to request the report for the selected time. 
When `<selectedLocationVariable>` is configured in [DynamicReportDisplays.xml](https://publicwiki.deltares.nl/spaces/FEWSDOC/pages/352944402/37+Dynamic+Report+Displays+Web+OC+only), a location selection menu also becomes available.

---

**Embedded Browser**

When a `<embedUrl>` element is configured in the selected topology node, Web OC will open an embedded browser window for the URL configured. Please note that [Content Security Policy](https://deltares.github.io/fews-web-oc/deployments/#content-security-policy-csp-headers) must be configured correctly to allow embedding.

---

**External url**

When a `<url>` element is configured in the selected topology node, Web OC will open a new browser window (outside Web OC) for the URL configured.  
⚠️ This is only supported for topology nodes with *only* the `<url>` element configured.  

---

**Filters**

Web OC will show a map, displaying all locations configured in the `filterId` linked to the selected topology node. Locations are also listed in a drop-down menu. Use the `<filterId>` item in `Topology.xml` to configure a filterId.  

By selecting a location on the map (hold **Ctrl** key for multi-select) or from the list, time series graphs will be displayed for all parameters configured in `Filters.xml` for the linked filterId. Time series graphs are grouped by `parameterGroup`. The period shown in the graph corresponds to the configured relative view period (relative to Web OC system time) of the time series in the `Filters.xml`.

When locations are shown on the Web OC map, icons are used as configured in Delft-FEWS. Icon overlays for threshold crossings are also shown consistently with the Delft-FEWS Desktop OC.  

See [Thresholds documentation](https://publicwiki.deltares.nl/display/FEWSDOC/09+Thresholds). Information on threshold crossings for the configured filter will be visualised when  
```xml
<showActiveThresholdCrossingsForFilters>true</showActiveThresholdCrossingsForFilters>
```
is configured in `WebOperatorClient.xml`. If configured the following threshold information will be made available:
1. An indicator for the number of locations with threshold crossings per topology node will be shown in the topology navigation panel on the left-side of the GUI. 
2. A threshold icon in the topbar. The icon is greyed out when no threshold crossings are active for the configured filter. If there are threshold crossings, then the icon will have the color of the most severe threshold color.
3. A threshold panel, accessible by clicking on the threshold icon in the topbar. The panel shows an overview with the thresholdcrossings, sorted by location. In addition location on the map can be filtered by clicking on the threshold summary icons.

---

**Log Displays**

Log Displays as configured in the `DisplayConfigFiles` folder of the Delft-FEWS Config. One or more log displays can be configured and referenced in the `Topology.xml` using the `<logDisplayId>` element. For more information about the configuration of the Log Displays refer to the [configuration documentation](https://publicwiki.deltares.nl/spaces/FEWSDOC/pages/352944218/36+Log+Displays+Web+OC+only).

---

**Report**

Reports generated by the [FEWS Report Module](https://publicwiki.deltares.nl/display/FEWSDOC/09+Report+Module) can be made available for display in Web OC. In order to link a report to a topology node, the element `<reportModuleInstanceId>` in `Topology.xml` has be configured at topology node level. Only reports that are stored in the FEWS database can be displayed in Web OC (`<sendToLocalFileSystem> = false` in report module configuration).

---

**Run Task**

It is possible to submit a task to the Delft-FEWS back-end by configuring a `<workflowId>` or `<secondaryWorkflowId>` in `Topology.xml`. At the moment only workFlows with a whatIfTemplateId (workFlowDescriptors.xml) can be submitted. You have to explicitly allow tasks to run from Web OC by configuring `<runTask enabled="true"/>` in `WebOperatorClient.xml` (default is false). When correctly configured, a "Run Task" option will appear in the Web OC side panel.

_Support for what-if scenarios_

TO BE ADDED

_Limitations_

TO BE ADDED

_Pre-defined properties_

Pre-defined properties are xMin, xMax, yMin, yMax, xCellSize, and yCellSize. When these properties are configured in the whatIfTemplate, Web OC will provide users with the option to draw a bounding box on the map. The task will be submitted using the [processdata endpoint](https://publicwiki.deltares.nl/display/FEWSDOC/FEWS+PI+REST+Web+Service#FEWSPIRESTWebService-GETprocessdata(2017.02)) instead of [POST run task](https://publicwiki.deltares.nl/display/FEWSDOC/FEWS+PI+REST+Web+Service#FEWSPIRESTWebService-POSTruntask(2017.02)). 

The purpose of the processdata endpoint is to download data based on the xMin, xMax, yMin, yMax, xCellSize, and yCellSize properties provided by the user. A pre-defined property `FILE_NAME` can be configured in [WorkflowDescriptors.xml](https://publicwiki.deltares.nl/display/FEWSDOC/13+WorkflowDescriptors) to set the name of the file to be downloaded. The file name will then be `yyyyMMddTHHmmssFILE_NAME`.

Other pre-defined properties are latitude and longitude. When these properties are configured in the whatIfTemplate, Web OC will provide users with the option to draw a point on the map. Coordinates of the point selected will be submitted to the back-end when running the scenario. 

_Run task panel in a dashboard_

Instead of running a task from the web oc side panel its also possible to add the run task option to a web oc dashboard. See [Web OC Dashboards](https://publicwiki.deltares.nl/spaces/FEWSDOC/pages/356779153/38+Web+OC+Dashboards)

---

**SchematicStatusDisplay**

_(no description provided yet — add details here if needed, e.g., how `<scadaDisplayId>` and `<scadaPanelId>` are configured)_

---

**Spatial Display**

Web OC will show a map, displaying the configured plotId linked to the selected topology node. Use the `<gridDisplaySelection>` item in `Topology.xml` to configure a plotId. A time slider will show up for navigation in time. The period covered by the time slider is based on the configured relative view period of the time series in the `GridDisplay.xml` with reference to the system time of Web OC (system time of user's device).

The classbreaks (legend) on the Spatial Display is only shown in the Web-OC when the Spatial Display plotId uses classbreaks from the `TimeSeriesDisplayConfig.xml`. Examples are provided on the Delft-FEWS WIKI pages: [Time Series Display Configuration](https://publicwiki.deltares.nl/display/FEWSDOC/02+Time+Series+Display+Configuration) and [Grid Display Configuration](https://publicwiki.deltares.nl/display/FEWSDOC/01+Grid+Display#id-01GridDisplay-_Toc154574473_Toc95297306classBreaks). It is possible to configure multiple classBreaks for a single gridPlot. Web OC will allow users to switch between them. 

Optionally, gridded vector data can be shown as an animated layer in Web OC by configuring the `<animatedVectors>` settings in [Spatial Display](https://publicwiki.deltares.nl/display/FEWSDOC/01+Grid+Display).

---


**Web OC Dashboards**

In `Topology.xml`, a dashboard is linked to a node using `<webOCDashboardId>`.  
For further configuration, see: [WebOCDashboards.xml](https://publicwiki.deltares.nl/spaces/FEWSDOC/pages/356779153/38+Web+OC+Dashboards).

---

## Threshold Information in WebOC

In **WebOC**, the following options exist for displaying threshold information:

1. **Icons on the map**  
   For this feature, a `filterId` must be linked to a topology node.  
   Location overlay icons are displayed on the map, consistent with the Desktop OC.

2. **Count on topology tree**  
   Indicates the number of threshold crossings by means of a “count” per topology node.  
   A `filterId` must be linked to a topology node for this to work.  
   When this is the case, the topology tree shows the number of locations for which threshold exceedances exist.  
   This option is only visible if  
   `<showActiveThresholdCrossingsForFilters>true</showActiveThresholdCrossingsForFilters>`

3. **Thresholds overview**
   Indicates the number of threshold crossings by means of a “count” per topology node.  
   A `filterId` must be linked to a topology node for this to work.  
   When this is the case, the top bar displays a count of the number of locations for which threshold exceedances exist.  
   By double-clicking, the threshold overview becomes visible in a side panel.  
   This option is only visible if  
   `<showActiveThresholdCrossingsForFilters>true</showActiveThresholdCrossingsForFilters>`

## Web OC side panel

Web OC includes a side panel that can be opened via the *kebab menu* (three vertical dots) in the top-right corner of the screen.  
Depending on the [configuration](https://publicwiki.deltares.nl/display/FEWSDOC/11+Web+Operator+Client), the following information may be visible:

- **Task overview**  
Overview of tasks, which can be filtered by task status (running, pending, completed, etc.).  
`<taskOverview enabled="true"/>`

- **Non-Current Data**  
By default, both charts and maps display the current forecast.
Through this panel, the current forecast can be compared with other available forecasts.
`<nonCurrentData enabled="true"/>`

- **Import Status**  
Import status overview, equivalent to the System Monitor → Import Status view in Desktop OC.
`<importStatus enabled="true"/>`

- **Run Tasks**  
If a topology node is linked to a `workflowId` or a `secondaryWorkflow` (with `whatIfTemplateId`), the corresponding task can be started via this panel.
`<runTask enabled="true"/>` 
See also: [Web OC navigation using Topology](https://deltares.github.io/fews-web-oc/configuration/#web-oc-navigation-using-topology).  

- **More Info**
If a `<documentFile>` is linked to a topology node, it can be accessed via this panel.
`<documentFile enabled="true"/>`
See also: [Web OC navigation using Topology](https://deltares.github.io/fews-web-oc/configuration/#web-oc-navigation-using-topology).  

### Permissions

By assigning viewPermissions in Topology.xml, it is possible to configure nodes for Web OC users that do not affect usage in the "thick" client. If authentication is not used for Web OC, permissions can still be utilized by configuring "defaultUser" in [WebServices.xml](https://publicwiki.deltares.nl/pages/viewpage.action?pageId=220266993). The Web OC component that utilizes Topology.xml is TopologyDisplay.

## Other WEB OC functional components

Next to the Topology Display, three additional components can be configured in WebOperatorClient.xml: spatialDisplay, systemMonitor and schematicStatusDisplay.

**spatialDisplay**: A tree view will list all gridPlots (configured permissions respected) from the Spatial Display. Selected dataLayer will be displayed on the map.

**systemMonitor**: “Import status” and “Running Tasks” components of system monitor will be displayed in Web OC.

**schematicStatusDisplay**: A tree view will list all SSD displayGroups including all displayPanels (configured permissions respected) available to FewsWebServices. Most click-actions on displayPanels are supported, see [SSD Service documentation](https://publicwiki.deltares.nl/display/FEWSDOC/FEWS+Schematic+Status+Display+%28SSD%29+Web+Service).

**HTML display**: Component, only available in Web OC, to either show static HTML pages stored in the FEWS Configuration (WebResourceFiles) or external web pages. See [WebOperatorClient.xml configuration](https://publicwiki.deltares.nl/display/FEWSDOC/11+Web+Operator+Client).

**Help menu**: Drop-down menu available on the bottom left side of Web OC. See [WebOperatorClient.xml configuration](https://publicwiki.deltares.nl/display/FEWSDOC/11+Web+Operator+Client).

## Known issues

- The FewsWebServices _thinning_ [option](https://publicwiki.deltares.nl/display/FEWSDOC/FEWS+PI+REST+Web+Service#FEWSPIRESTWebService-GETtimeseries) is used while retrieving data for Web OC time series graphs and tables. This function tries to keep the peaks and gaps and minimizes the number of time steps that have to be retrieved. Eventually, _thinning_ should not be used for time series tables. In future releases of Web OC _thinning_ will only be used for time series graphs.
