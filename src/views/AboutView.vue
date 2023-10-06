<template>
  <v-card class="home-card">
    <v-card-title class="justify-center">
      Welcome to the Delft-FEWS Web OC!
    </v-card-title>
    <v-card-text v-if="store.activeComponents.length > 0">
      Select one of the following options to get started.
    </v-card-text>
    <v-card-text v-else>
      Unfortunately, you do not have access
      <v-icon>mdi-emoticon-sad-outline</v-icon>
    </v-card-text>
    <v-list density="compact">
      <v-list-item
        v-for="(item, i) in store.activeComponents"
        :key="i"
        :value="item"
        :to="item.to"
      >
        <template v-slot:prepend>
          <v-icon :icon="item.icon"></v-icon>
        </template>
        <v-list-item-title v-text="item.title"></v-list-item-title>
      </v-list-item>
    </v-list>
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
import { PiWebserviceProvider, Version } from '@deltares/fews-pi-requests'
import { onMounted } from 'vue'
import { useConfigStore } from '../stores/config.ts'
import { configManager } from '@/services/application-config'

const webServiceUrl = configManager.get('VITE_FEWS_WEBSERVICES_URL')
const version = ref(packageConfig.version)
const webServiceVersion = ref<Version>({
  implementation: '',
  buildType: '',
  buildNumber: '',
  buildTime: '',
})
const store = useConfigStore()

onMounted(async () => {
  const webServiceProvider = new PiWebserviceProvider(webServiceUrl)
  webServiceVersion.value = await (
    await webServiceProvider.getVersion()
  ).version
})
</script>

<style scoped>
.home-card {
  margin: auto;
  margin-top: 5%;
  width: fit-content !important;
  height: fit-content !important;
}
</style>
