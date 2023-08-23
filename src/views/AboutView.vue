<template>
  <v-card class="home-card">
    <v-card-title class="justify-center">
      Welcome to the Delft-FEWS Web OC!
    </v-card-title>
    <v-card-text>
      Unfortunately, you do not have access
      <v-icon>mdi-emoticon-sad-outline</v-icon>
    </v-card-text>
    <v-card-text>
      <v-row>
        <v-col cols="4"> WebOC </v-col>
        <v-col cols="6"> v{{ version }} </v-col>
      </v-row>
      <v-row>
        <v-col cols="4"> Web Service </v-col>
        <v-col cols="6">
          {{ webServiceVersion.implementation }} #{{
            webServiceVersion.buildNumber
          }}
          {{
            webServiceVersion.buildType === 'development' ? 'development' : ''
          }}
        </v-col>
      </v-row>
      <v-row>
        <v-col cols="12">
          <a :href="webServiceUrl">{{ webServiceUrl }} </a>
        </v-col>
      </v-row>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import packageConfig from '../../package.json'
import { PiWebserviceProvider } from '@deltares/fews-pi-requests'

const version = ref(packageConfig.version)
const webServiceUrl = ref('')

const baseUrl =
  'https://rwsos-dataservices-ont.avi.deltares.nl/iwp/test/FewsWebServices'
const webServiceProvider = new PiWebserviceProvider(baseUrl)
const webServiceVersion = await (await webServiceProvider.getVersion()).version
</script>

<style scoped>
.home-card {
  margin: auto;
  margin-top: 5%;
  width: fit-content !important;
  height: fit-content !important;
}
</style>
