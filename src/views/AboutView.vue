<template>
  <v-card class="home-card">
    <v-card-title class="justify-center">
      {{ configStore.general.title ?? 'Delft-FEWS Web OC' }}
    </v-card-title>
    <v-card-text v-if="configStore.activeComponents.length > 0">
      Select one of the following options to get started.
    </v-card-text>
    <v-card-text v-else>
      Unfortunately, you do not have access
      <v-icon>mdi-emoticon-sad-outline</v-icon>
    </v-card-text>
    <v-list density="compact">
      <v-list-item
        v-for="(item, i) in configStore.activeComponents"
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
        <v-col cols="4">WebOC </v-col>
        <v-col>
          <v-chip size="small" prepend-icon="mdi-tag-outline">{{
            version
          }}</v-chip>
          <template v-if="commitHash !== ''">
            <v-chip size="small" prepend-icon="mdi-source-commit">{{
              commitHash
            }}</v-chip>
            <v-chip size="small" prepend-icon="mdi-package-variant-closed">{{
              buildDate
            }}</v-chip>
          </template>
        </v-col>
      </v-row>
      <v-row>
        <v-col cols="4"> Web Service </v-col>
        <v-col>
          <v-chip size="small" prepend-icon="mdi-tag-outline">{{
            webServiceVersion.implementation
          }}</v-chip>
          <v-chip size="small" prepend-icon="mdi-package-variant-closed"
            >#{{ webServiceVersion.buildNumber }}</v-chip
          >
          <v-chip
            v-if="webServiceVersion.buildType === 'development'"
            size="small"
            prepend-icon="mdi-source-branch"
            >development'</v-chip
          >
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
import { createTransformRequestFn } from '@/lib/requests/transformRequest'

const webServiceUrl = configManager.get('VITE_FEWS_WEBSERVICES_URL')

const version = ref(packageConfig.version)
const commitHash = __GIT_TAG__ ? '' : __GIT_HASH__
const buildDate = new Date(__BUILD_DATE__).toISOString()

const webServiceVersion = ref<Version>({
  implementation: '',
  buildType: '',
  buildNumber: '',
  buildTime: '',
})
const configStore = useConfigStore()

onMounted(async () => {
  const webServiceProvider = new PiWebserviceProvider(webServiceUrl, {
    transformRequestFn: createTransformRequestFn(),
  })
  webServiceVersion.value = await (
    await webServiceProvider.getVersion()
  ).version
})
</script>

<style scoped>
.home-card {
  margin: auto;
  margin-top: 5%;
  width: fit-content;
  max-width: 100%;
  height: fit-content !important;
}
</style>
