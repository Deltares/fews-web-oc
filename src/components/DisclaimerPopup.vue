<template>
  <v-dialog v-model="showDialog" max-width="900">
    <template v-slot:activator="{ on, attrs }">
      <v-btn icon v-on="on" v-attrs="attrs"><v-icon>mdi-information</v-icon></v-btn>
    </template>
    <v-card>
      <v-card-title>USER TERMS AND CONDITIONS</v-card-title>
      <v-card-text>
        <!-- Generated using pandoc from .docx -->
        <p>The METOC WebViewer (further referred to as 'Viewer') is subject to
          the terms and conditions of use as set out below.</p>
        <p>Article 1: General purpose and allowed use</p>
        <ul>
          <li>
            <p>1.1 The sole allowed use of the Viewer is to provide Users access
              to measured and simulated meteorological and oceanographic data in the
              Arabian Gulf, Gulf of Oman, Red Sea, Gulf of Aden and Eastern
              Mediterranean.</p>
          </li>
        </ul>
        <ul>
          <li>
            <p>1.2 All data provided through the Viewer are only validated to a
              very limited extent.</p>
          </li>
          <li>
            <p>1.3 User hereby agrees not to provide information to third
              parties or the general public.</p>
          </li>
        </ul>
        <p>Article 2: License</p>
        <ul>
          <li>
            <p>2.1 Deltares grants User a non-exclusive, worldwide,
              royalty-free, non-transferable and non-sublicensable license to use the
              Viewer strictly for the purpose and in accordance with the limitations
              specified in this User Agreement. This license is provided solely under
              the condition that User complies with the provisions of this User
              Agreement.</p>
          </li>
        </ul>
        <p>Article 3: Use of the Viewer</p>
        <ul>
          <li>
            <p>3.1 User acknowledges and agrees:</p>
            <ul>
              <li>
                <p>a) that User is only authorized to use the Viewer within its own
                  organisation and for its own use;</p>
              </li>
              <li>
                <p>b) not to use the Viewer in any manner whereby User claims, acts
                  like or appears to be, endorsed by, owned by or affiliated with
                  Deltares;</p>
              </li>
              <li>
                <p>c) that the use of the Viewer is at User's own risk and
                  expense;</p>
              </li>
              <li>
                <p>d) to interpret any data and information resulting from the
                  Viewer with care, to ensure not to conclude false understandings of
                  possible impacts;</p>
              </li>
              <li>
                <p>e) that User remains solely responsible for the interpretation of
                  the data and information resulting from the Viewer and the decisions
                  made regarding the accuracy, currency, reliability and correctness of
                  information and data obtained through the Viewer;</p>
              </li>
              <li>
                <p>f) that User remains solely responsible for performing the
                  appropriate risk assessments prior to any action or activity performed
                  by the User's interpretation of the Viewer;</p>
              </li>
              <li>
                <p>g) that the Viewer may only be used for legitimate and lawful
                  purposes, in a manner that cannot in any way i) harm Deltares or ii)
                  infringe the rights of third parties;</p>
              </li>
              <li>
                <p>h) never to (re)sell, re-distribute, make available, grant access
                  to or communicate this Website nor the Viewer to any third
                  party.</p>
              </li>
            </ul>
          </li>
        </ul>
        <p>Article 4: Intellectual Property Rights</p>
        <ul>
          <li>
            <p>4.1 Unless stated differently, all intellectual property rights
              in connection with the Viewer, including the software, texts, images and
              sounds, are vested exclusively in Deltares, in its affiliates or its
              contractors.</p>
          </li>
          <li>
            <p>4.2 This means, among other things, that it is not permitted to,
              without the prior, written permission of Deltares, to make public,
              reproduce, copy, modify and/or adjust the information of the Viewer, or
              information pertaining to the Viewer, except for personal,
              non-commercial use or in so far as otherwise permitted under mandatory
              law. User acknowledges and agrees that with this User Agreement, no
              transfer of ownership whatsoever, including the transfer of intellectual
              property rights is made to User.</p>
          </li>
        </ul>
        <p>Article 5: No warranty, indemnification</p>
        <ul>
          <li>
            <p>5.1 Although this Viewer have been set up with the greatest
              possible care, these are provided (AS-IS) without any warranty of any
              kind.</p>
          </li>
          <li>
            <p>5.2 User acknowledges and agrees to the warranty provisions
              specified below that are applicable to the type of dataset for which
              User accesses the Viewer.</p>
          </li>
        </ul>
        <ul>
          <li>
            <p>5.3. For User terms and conditions of other parties' datasets
              included in the Viewer, the User is referred to:</p>
          </li>
        </ul>
        <table>
          <colgroup>
            <col style="width: 21%" />
            <col style="width: 14%" />
            <col style="width: 18%" />
            <col style="width: 46%" />
          </colgroup>
          <thead>
            <tr class="header">
              <th><strong>Name</strong></th>
              <th><strong>Ownership</strong></th>
              <th><strong>Data types</strong></th>
              <th><strong>User terms and conditions</strong></th>
            </tr>
          </thead>
          <tbody>
            <tr class="odd">
              <td>NOAA Global Forecasting System (GFS)</td>
              <td>NOAA</td>
              <td>wind, air pressure, air temperature, visibility</td>
              <td><a href="https://www.weather.gov/disclaimer"><u>https://www.weather.gov/disclaimer</u></a></td>
            </tr>
            <tr class="even">
              <td>WAVEWATCH III</td>
              <td>NOAA</td>
              <td>wave height, wave period, wave direction</td>
              <td><a href="https://www.weather.gov/disclaimer">https://www.weather.gov/disclaimer</a></td>
            </tr>
            <tr class="odd">
              <td>E.U. Copernicus Marine Environment Monitoring Service (CMEMS)</td>
              <td>CMEMS</td>
              <td>sea surface heights, currents, temperature, salinity, dissolved
                oxygen</td>
              <td><a
                  href="https://marine.copernicus.eu/user-corner/service-commitments-and-licence">https://marine.copernicus.eu/user-corner/service-commitments-and-licence</a>
              </td>
            </tr>
            <tr class="even">
              <td>Visible Infrared Imager-Radiometer Suite (VIIRS)</td>
              <td>NASA</td>
              <td>sea surface temperature</td>
              <td><a
                  href="https://www.earthdata.nasa.gov/learn/use-data/data-use-policy">https://www.earthdata.nasa.gov/learn/use-data/data-use-policy</a>
              </td>
            </tr>
            <tr class="odd">
              <td>Spinning Enhanced Visible and InfraRed Imager (SEVIRI)</td>
              <td>EUMETSAT</td>
              <td>sea surface temperature</td>
              <td><a href="https://www.eumetsat.int/about-us/terms-use">https://www.eumetsat.int/about-us/terms-use</a>
              </td>
            </tr>
            <tr class="even">
              <td>Moderate-resolution Imaging Spectroradiometer Terra and Aqua
                (MODIS-A and MODIS-T)</td>
              <td>NASA</td>
              <td>sea surface temperature, Secchi depth, chlorophyll</td>
              <td><a
                  href="https://science.nasa.gov/earth-science/earth-science-data/data-information-policy/">https://science.nasa.gov/earth-science/earth-science-data/data-information-policy/</a>
              </td>
            </tr>
          </tbody>
        </table>
        <ul>
          <li>
            <p>5.4 Deltares expressly disclaims any implied warranty or
              merchantability, fitness for a particular purpose, or for failure of
              performance and any and all liability for any loss or damage whatsoever
              suffered as a result of User's use or reliance upon the Viewer.</p>
          </li>
          <li>
            <p>5.5 Furthermore, Deltares does not guarantee that the Viewer is
              free of viruses and work without errors and/or interruptions.</p>
          </li>
          <li>
            <p>5.6 To the best of Deltares' knowledge and belief, the Viewer
              does not infringe any third-party copyright or any other intellectual
              property. Any responsibility or liability of Deltares for claims, costs,
              expenses and/or consequential losses or damages resulting from or
              arising out of any infringement of intellectual property rights is
              excluded.</p>
          </li>
          <li>
            <p>5.7 User shall indemnify, hold harmless and defend Deltares
              against any action brought by a third party against Deltares and/or its
              officers, directors, employees or agents to the extent that such a claim
              is connected to the use of the Viewer by User and/or third parties at
              whose disposal User has placed the Website and/or Viewer.</p>
          </li>
        </ul>
        <p>Article 6: Duration</p>
        <ul>
          <li>
            <p>6.1 This User Agreement is concluded for an unlimited period of
              time.</p>
          </li>
        </ul>
        <p>Article 7: Privacy</p>
        <ul>
          <li>
            <p>7.1 Any and all of User's personal data that User may provide to
              Deltares for purposes of his/her use of the Viewer, will be processed in
              accordance with the General Data Protection Regulation (EU) 2016/679 and
              the Netherlands GDPR implementation Law 'Uitvoeringswet Algemene
              verordering gegevensbescherming' (stb 2018, 145). Our Privacy Statement
              sets out when and why we collect the data, exactly what that data is,
              and how it will be processed and, above all, protected. Please read the
              statement carefully, available on this website:
              https://wetten.overheid.nl/BWBR0040940/2021-07-01.</p>
          </li>
        </ul>
        <p>Article 8: Liability</p>
        <ul>
          <li>
            <p>8.1 User agrees that Deltares (including its personnel and
              non-employees who (have) undertake(n) activities for Deltares) shall not
              be responsible to User for any loss-of-profit, direct, indirect,
              incidental special or consequential damages arising out of the User
              Agreement, the use of the Viewer, or the non-availability of the Viewer,
              except for damages caused by wilful misconduct or gross negligence of
              Deltares.</p>
          </li>
        </ul>
        <p>Article 9 Miscellaneous</p>
        <ul>
          <li>
            <p>9.1 The parties are not allowed to assign any rights and/or
              obligations under the User Agreement, entirely or in part, to third
              parties without the prior written consent of the other party.</p>
          </li>
          <li>
            <p>9.2 This Agreement constitutes the complete and exclusive
              understanding between User and Deltares relating to its subject matter,
              and supersedes all prior and contemporaneous representations,
              correspondence, proposals or User license agreements, whether oral or
              written.</p>
          </li>
          <li>
            <p>9.3 Any disputes arising from and/or connected to the User
              Agreement, and any agreements arising therefrom, shall be submitted
              solely to the competent court of The Hague, the Netherlands.</p>
          </li>
          <li>
            <p>9.4 User agrees that the Website and the resulting Viewer do not
              give rise to personal jurisdiction over Deltares, either specific or
              personal, in jurisdictions other than the laws of the Netherlands. This
              Agreement and all the agreements arising therefrom are governed
              exclusively by the laws of the Netherlands.</p>
          </li>
        </ul>
        <p>About Deltares</p>
        <p>This Viewer has been composed by, or at any rate by order of
          Stichting Deltares, with its registered office in Delft, 2629 HV, the
          Netherlands and its principal place of business at Boussinesqweg 1
          Delft, The Netherlands. Deltares is registered with the Dutch Chamber of
          Commerce and Industry under number 41146461.</p>
        <p>Deltares, October 2023</p>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'

@Component
export default class DisclaimerPopup extends Vue {
  showDialog: boolean = false
}
</script>
