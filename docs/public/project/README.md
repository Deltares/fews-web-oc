# Web OC project

## Introduction

At Deltares, we notice an increasing number of requests for web-based user-interfaces connected to Delft-FEWS.  Also, we see that there is a broader move ongoing towards online user-interfaces, with many comparable packages used internationally already providing such solutions. As such, the Delft-FEWS 2025 vision (https://oss.deltares.nl/web/delft-fews/vision-2025) also incorporates the development of a Web-based Operator Client (Web OC) (https://oss.deltares.nl/web/delft-fews/-/web-based-oc?redirect=%2Fweb%2Fdelft-fews%2Froadmaps).

## Development goals

Considering the use-case for a Web OC, we see the following key benefits:
- Easier deployment (compared to Desktop OC)
- Increased mobility (fast access through browser, also from mobile devices)
- Increased modularity (possibility to incorporate into existing online environments already in use by clients)
- Increased flexibility (the intention to have further options to customize the interface to user needs)
- Improvements to performance and security of Delft-FEWS web-services in consequence of the development of a secure and performant Web OC
- Technological developments. Benefit from all the technological developments and 3rd party functionality available for the web.

Furthermore, key overall assumptions are:

- The Web OC will serve expert users primarily.
- For the foreseeable future, the Web OC and Desktop OC will be developed and used in parallel. In some cases, the web-based UI might serve as an addition to the Desktop OC. In others it might serve as a replacement.
- Web OC will not be a clone of the existing Desktop OC regarding functionality and design.
- The Web OC will be a responsive web application, building on experience gained in prior web applications developed by Deltares 
- The Web OC will connect to the Delft-FEWS web services to interact with other Delft-FEWS components.
- The Web OC can be hosted anywhere, dependent on the client’s preference (on-premise, the cloud, …)
- The Web OC will become an integral part of the overall Delft-FEWS product.
- An open source, closed community license model will apply (see REFERENCE).

## Development process 

Key assumptions regarding the development process are:
- The development of the Web OC will apply a growth model. Starting from initial requirements and an initial prioritization, relevant functionality will be gradually and iteratively included or enhanced (in line with the current Delft-FEWS business model).   
- An initial Minimum Viable Product (MVP) version of the Web OC will likely include functionality to: 1) visualize data (time series, map fields, SCADA displays, also including associated information such as thresholds), 2) dispatching jobs, 3) visualize monitoring information, 4). Aanpassen, link naar presentaties
- Deltares will provide long-term support on the Web OC.

## Project timeline

| Time Period | Activities |
|-------------|------------|
| 2020 Q4     | International User Days. Presenting Web OC plans: [Vision 2025](https://oss.deltares.nl/web/delft-fews/vision-2025). |
| 2021        | Define use-cases and key assumptions and MVP.<br>First steps towards technical architecture: Involve both Deltares and external colleagues. |
|             | Start development work. |
|             | International User Days. Present architecture and 3rd party collaboration.<br>Interactive sessions on key functionality.|
| 2022        | Third-party testing of reusability Web OC building blocks. |
|             | Continuation of development work.<br>User feedback session during CSB meeting and NL/INT User Days. |
|             | International User Days. Demonstration / Plug & Play session Web OC / UI/UX Design session. |
| 2023        | Continuation of development work. |
|             | International User Days. Presentation status Web OC Developments.<br>Dec 2023 **2023.02 Delft-FEWS Web OC MVP Release.** Software available on [GitHub](https://github.com/Deltares/fews-web-oc). |
| 2024 onwards| Web OC Development in line with the current Delft-FEWS business model. |

## Present status

As stated in the section “Development process ” the development of Web OC will apply a growth model. Starting from initial requirements and an initial prioritization, relevant functionality will be gradually and iteratively included or enhanced (in line with the current Delft-FEWS business model). The initial requirements for the first release of Web OC have been defined together with the community during sessions organized at the FEWS Sofware days (refer to presentations). The key features were defined as:

Functional:
- Visualize data (time series, map fields, SCADA displays, also including associated information such as thresholds)
- Dispatching jobs
- Visualize monitoring information

Non-functional:
- Focus on code quality, test and deployement process.
- Adhere present day insights regarding cyber security, authentication and Authorization
- Performance
- Relevant configuration will be part of the existing Delft-FEWS configuration concept.  

In line with the features listed above, the first release of Web OC (Dec 2023, refer to release management section), will include the following:

| Initial requirements                                                                                                | Web OC release 1.0.0 (Dec 2023)\*                                                                                                                                                                                                                                                                                                                                                                                                                             |
| ------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------                                                    |
| **Functional**                                                                                                      |                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| Visualize data (time series, map fields, SCADA displays, also including associated information such as thresholds). | Visualize configured Display Groups when linked to toplogy node (graph/table view).<br>Visualize timeseries configured in Filters.xml when linked to toplogy node (graph/table view).<br>Show associated threshold levels in time series graphs.<br>Show associated quality flags in table view.<br>Show SCADA displays including support for most click-actions.<br>Visualize data layers configured in the spatial display.<br>Ensembles not supported yet. |
| Dispatching jobs                                                                                                    | Not supported in this release. However, FewsWebServices toplogy/nodes? Endpoint extended with information on workflows.                                                                                                                                                                                                                                                                                                                                       |
| Visualize monitoring information                                                                                    | “Import status” and “Running Tasks” components of system monitor available in Web OC.                                                                                                                                                                                                                                                                                                                                                                         |
| **Non-functional**                                                                                                  |                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| Focus on code quality, test and deployement process.                                                                | Back-end (FewsWebServices):<br>- Version management: Subversion<br>- Issue tracking in JIRA<br>- Development feature and unit tests<br>- Code Review<br>- Deploy new FewsWebServices on test server (both open and authorized version).                                                                                                                                                                                                                       |                                                                                                                                                         |
|                                                                                                                     | Front-end (Libaries and Web OC components):<br>- Version management: Deltares Github<br>- Issue tracking in JIRA<br>- New branch in Git for each issue (manual) <br>- Review and push to main branch (manual)<br>- Run tests for Typescript libraries (automated Teamcity)<br>- Run test for Web OC components (automated Teamcity)<br>- Test successful, deploy on Azure test environment (artifact on build server)                                         |
| Adhere present day insights regarding cyber security, authentication and authorization                              | Using OpenID Connect / Oauth2, for both Web OC front-end and FewsWebServices<br>FEWS permissions as configured in FEWS configuration respected by FewsWebServices<br>Run automated ZAP scan (OWASP) on Web OC components and demo Web OC.<br>Web OC will directly connect to FewsWebServices to obtain configuration and relevant data from the FEWS database.                                                                                                |
| Performance                                                                                                         | During the development process of Web OC, the FewsWebServices back-end will be enhanced continuously to improve performance and add functionality. It is intended not to introduce any additional software to the Web OC stack to further improve the performance of Web OC.                                                                                                                                                                                  |
| Relevant configuration will be part of the existing Delft-FEWS configuration concept.                               | All configuration related to what content is being displayed in Web OC, is managed by the Delft-FEWS configuration. Referentie                                                                                                                                                                                                                                                                                                                                |

*Please note that Web OC will not support all functionality available in the Desktop OC regarding the features listed above. In addition, not all configurations might be supported. For questions on this matter, please contact Web OC Team via fews-pm@deltares.nl. 

## Future plans

Following the December 2023 release of Web OC, the software will be developed further in line with the current Delft-FEWS business model. Currently, the following features are planned for:

- Support click actions on grid data: show time series of selected location.
- Support click actions on grid data: show vertical profile time series of selected location (3D data).
- Show vertical slider (elevation) for grid data when data layer consists of 3D data.
- FewsWebServices endpoint for static resources (logos, fonts, css etc.)
- FewsWebServices endpoint to better support time series table view.
- Run workflow from Topology node.
- Visualize scada display linked to Topology node.
- Support time series data edits in table view.

## Architectural principles

Key assumptions regarding the technical design and requirements are:	

- Existing or prior web applications developed by Deltares will serve as a reference for the technical design of the Web OC.
- The Web OC will connect to the Delft-FEWS web services to interact with other Delft-FEWS components. Where required these web-services will be further improved to enable this (improving performance, adding features)
- The Web OC will retrieve certain configuration data required on-the-fly (based on filters, spatial display, SCADA displays, workflow descriptors, …).
- Web OC configuration will not require expertise in web development, relevant configuration will be XML based and will be part of the existing Delft-FEWS configuration concept.
- The Web OC will be customizable for different user groups and workflows / work processes. User authentication and authorization will be possible.

- Relevant functionality will be implemented as components, which should be easily replaceable when these components are end-of-life. Components should be easily re-useable in other web applications, and components from existing web applications might be re-used in the Web OC. Modularity between components developed for the Web OC and third-party applications will be explored.
- The following software frameworks will serve as a basis for the further technical design:

- During design and development, present day insights and requirements regarding cyber security will be adhered to from the start.
- During design and development, present day insights regarding DevOps (continuous integration and deployment) will be adhered to from start.
- During development, tooling to monitor code quality will be applied (SonarQube or comparable).

## How to use Web OC in your organization?

Provided that you have a running Delft-FEWS system already, its suggested to follow the steps below to get started with Web OC.

-	Play around with a local Web OC for your FEWS system. 
    - FewsWebServices developments for the Web OC are available from FEWS 2023.02.
    - Ask FEWS Product Management / Deltares Project Lead for a recent Web OC build or download from Github.
-	Identify required Web OC developments / modifications.
-	Decide on development strategy: use Typescript libraries / Web OC components / Full stack.
-	Discuss developments and strategy with Deltares (architecture / timeline / budgets etc.)
-	Deltares to coordinate developments and to identify overlap with other Web OC projects
-	Developments organized in Sprint sessions (1 to 2 weeks): back-end, front-end, UX/UI.

## DSD Web OC presentations

Public presentations on the Delft-FEWS Web OC can be found here:
